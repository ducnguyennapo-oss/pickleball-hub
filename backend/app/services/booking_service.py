import uuid
from datetime import datetime, timezone
from decimal import Decimal
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.booking import Booking
from app.models.court import CourtSlot, SlotDefinition, Court
from app.models.wallet import Wallet, WalletTransaction
from app.models.user import User
from app.services.notification_service import manager
from app.utils.zalo import send_slot_full_notification


async def create_booking(db: AsyncSession, user_id: uuid.UUID, court_slot_id: uuid.UUID) -> Booking:
    """
    Atomically: check balance → check slot availability → deduct wallet → insert booking.
    Uses SELECT FOR UPDATE to prevent race conditions under concurrent load.
    """
    async with db.begin():
        # Row-lock wallet and slot simultaneously
        wallet = await db.scalar(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        if not wallet:
            raise HTTPException(status_code=404, detail="Ví không tồn tại")

        court_slot = await db.scalar(
            select(CourtSlot).where(CourtSlot.id == court_slot_id).with_for_update()
        )
        if not court_slot:
            raise HTTPException(status_code=404, detail="Slot không tồn tại")
        if court_slot.status in ("full", "closed"):
            raise HTTPException(status_code=409, detail="Slot đã đầy hoặc đã đóng")

        slot_def = await db.scalar(
            select(SlotDefinition).where(SlotDefinition.id == court_slot.slot_def_id)
        )
        court = await db.scalar(select(Court).where(Court.id == slot_def.court_id))

        price = slot_def.price
        if wallet.balance < price:
            raise HTTPException(
                status_code=402,
                detail=f"Số dư không đủ. Cần {price:,.0f}đ, hiện có {wallet.balance:,.0f}đ"
            )

        # Check no duplicate booking
        existing = await db.scalar(
            select(Booking).where(
                Booking.user_id == user_id,
                Booking.court_slot_id == court_slot_id,
                Booking.status != "cancelled",
            )
        )
        if existing:
            raise HTTPException(status_code=409, detail="Bạn đã đăng ký slot này rồi")

        # Deduct wallet
        new_balance = wallet.balance - price
        wallet.balance = new_balance

        txn = WalletTransaction(
            wallet_id=wallet.id,
            type="deduct",
            amount=price,
            balance_after=new_balance,
            note=f"Đặt sân {court.name} ngày {court_slot.play_date} {slot_def.start_time}-{slot_def.end_time}",
        )
        db.add(txn)
        await db.flush()

        # Update slot
        new_player_count = court_slot.current_players + 1
        court_slot.current_players = new_player_count
        if new_player_count >= slot_def.max_players:
            court_slot.status = "full"
        elif new_player_count > 0:
            court_slot.status = "partial"

        booking = Booking(
            user_id=user_id,
            court_slot_id=court_slot_id,
            status="confirmed",
            amount_charged=price,
            txn_id=txn.id,
        )
        db.add(booking)
        await db.flush()
        booking_id = booking.id

        # Capture data for post-commit notifications
        slot_full = new_player_count >= slot_def.max_players and not court_slot.notified_full
        if slot_full:
            court_slot.notified_full = True

        slot_update_data = {
            "court_slot_id": str(court_slot_id),
            "current_players": new_player_count,
            "max_players": slot_def.max_players,
            "status": court_slot.status,
        }
        full_notification_data = None
        if slot_full:
            # Collect all booked users for Zalo notification
            booked_users = await db.execute(
                select(User.zalo_uid).join(Booking, Booking.user_id == User.id).where(
                    Booking.court_slot_id == court_slot_id,
                    Booking.status == "confirmed",
                )
            )
            full_notification_data = {
                "zalo_uids": [row[0] for row in booked_users.fetchall() if row[0]],
                "court_name": court.name,
                "play_date": str(court_slot.play_date),
                "start_time": str(slot_def.start_time),
                "end_time": str(slot_def.end_time),
            }

    # Post-commit: SSE broadcast + Zalo notifications (non-blocking)
    asyncio.create_task(manager.broadcast_slot_update(**slot_update_data))
    if full_notification_data:
        asyncio.create_task(_send_full_notifications(**full_notification_data))

    await db.refresh(booking)
    return booking


async def cancel_booking(db: AsyncSession, booking_id: uuid.UUID, user_id: uuid.UUID) -> Booking:
    booking = await db.scalar(select(Booking).where(Booking.id == booking_id))
    if not booking or booking.user_id != user_id:
        raise HTTPException(status_code=404, detail="Booking không tồn tại")
    if booking.status != "confirmed":
        raise HTTPException(status_code=409, detail="Không thể huỷ booking này")

    async with db.begin():
        wallet = await db.scalar(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        court_slot = await db.scalar(
            select(CourtSlot).where(CourtSlot.id == booking.court_slot_id).with_for_update()
        )
        slot_def = await db.scalar(
            select(SlotDefinition).where(SlotDefinition.id == court_slot.slot_def_id)
        )

        # Refund
        new_balance = wallet.balance + booking.amount_charged
        wallet.balance = new_balance
        txn = WalletTransaction(
            wallet_id=wallet.id,
            type="refund",
            amount=booking.amount_charged,
            balance_after=new_balance,
            note=f"Hoàn tiền huỷ sân",
            ref_id=str(booking.id),
        )
        db.add(txn)

        court_slot.current_players = max(0, court_slot.current_players - 1)
        if court_slot.current_players == 0:
            court_slot.status = "available"
        elif court_slot.current_players < slot_def.max_players:
            court_slot.status = "partial"

        booking.status = "cancelled"
        booking.cancelled_at = datetime.now(timezone.utc)

    await db.refresh(booking)
    return booking


async def _send_full_notifications(zalo_uids: list[str], court_name: str, play_date: str, start_time: str, end_time: str) -> None:
    for uid in zalo_uids:
        try:
            await send_slot_full_notification(uid, court_name, play_date, start_time, end_time)
        except Exception:
            pass  # Don't fail booking if notification fails
