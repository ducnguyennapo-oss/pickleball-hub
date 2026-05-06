import uuid
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.court import Court, SlotDefinition
from app.models.booking import Booking
from app.models.wallet import Wallet, WalletTransaction
from app.schemas.court import CreateCourtRequest, CreateSlotDefinitionRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    today = date.today()
    total_bookings_today = await db.scalar(
        select(func.count(Booking.id)).where(
            func.date(Booking.booked_at) == today, Booking.status != "cancelled"
        )
    )
    total_members = await db.scalar(select(func.count(User.id)).where(User.is_admin == False))
    total_revenue_today = await db.scalar(
        select(func.sum(Booking.amount_charged)).where(
            func.date(Booking.booked_at) == today, Booking.status != "cancelled"
        )
    )
    return {
        "bookings_today": total_bookings_today or 0,
        "total_members": total_members or 0,
        "revenue_today": float(total_revenue_today or 0),
    }


@router.get("/members")
async def list_members(db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)):
    result = await db.execute(
        select(User, Wallet)
        .join(Wallet, Wallet.user_id == User.id)
        .where(User.is_admin == False)
        .order_by(User.created_at.desc())
    )
    return [
        {
            "id": str(u.id),
            "phone": u.phone,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "balance": float(w.balance),
            "created_at": u.created_at.isoformat(),
        }
        for u, w in result.fetchall()
    ]


class AdminTopupRequest(BaseModel):
    amount: float
    note: str = "Nạp tiền thủ công bởi admin"


@router.post("/members/{user_id}/topup")
async def admin_topup(
    user_id: uuid.UUID,
    body: AdminTopupRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    wallet = await db.scalar(select(Wallet).where(Wallet.user_id == user_id).with_for_update())
    if not wallet:
        raise HTTPException(status_code=404, detail="Ví không tồn tại")

    amount = Decimal(str(body.amount))
    new_balance = wallet.balance + amount
    wallet.balance = new_balance

    txn = WalletTransaction(
        wallet_id=wallet.id,
        type="topup",
        amount=amount,
        balance_after=new_balance,
        note=body.note,
        ref_id=f"admin-{admin.id}",
    )
    db.add(txn)
    await db.commit()
    return {"message": "Nạp tiền thành công", "new_balance": float(new_balance)}


@router.post("/courts", status_code=201)
async def create_court(
    body: CreateCourtRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    court = Court(name=body.name, description=body.description)
    db.add(court)
    await db.commit()
    await db.refresh(court)
    return {"id": str(court.id), "name": court.name}


@router.post("/courts/{court_id}/slots", status_code=201)
async def create_slot_definition(
    court_id: uuid.UUID,
    body: CreateSlotDefinitionRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    court = await db.scalar(select(Court).where(Court.id == court_id))
    if not court:
        raise HTTPException(status_code=404, detail="Sân không tồn tại")

    slot_def = SlotDefinition(
        court_id=court_id,
        slot_index=body.slot_index,
        start_time=body.start_time,
        end_time=body.end_time,
        price=Decimal(str(body.price)),
        max_players=body.max_players,
    )
    db.add(slot_def)
    await db.commit()
    return {"message": "Tạo slot thành công"}


@router.get("/bookings")
async def all_bookings(
    play_date: date = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = select(Booking).order_by(Booking.booked_at.desc()).limit(100)
    if play_date:
        from app.models.court import CourtSlot
        query = query.join(CourtSlot, CourtSlot.id == Booking.court_slot_id).where(
            CourtSlot.play_date == play_date
        )
    result = await db.execute(query)
    return [
        {
            "id": str(b.id),
            "user_id": str(b.user_id),
            "court_slot_id": str(b.court_slot_id),
            "status": b.status,
            "amount_charged": float(b.amount_charged),
            "booked_at": b.booked_at.isoformat(),
        }
        for b in result.scalars()
    ]
