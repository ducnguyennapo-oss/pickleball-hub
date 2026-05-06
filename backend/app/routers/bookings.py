import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.booking import Booking
from app.models.court import CourtSlot, SlotDefinition, Court
from app.schemas.booking import CreateBookingRequest
from app.services.booking_service import create_booking, cancel_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/", status_code=201)
async def book_slot(
    body: CreateBookingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = await create_booking(db, current_user.id, body.court_slot_id)
    return {"message": "Đặt sân thành công", "booking_id": str(booking.id)}


@router.get("/me")
async def my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Booking)
        .where(Booking.user_id == current_user.id)
        .options(
            selectinload(Booking.court_slot).selectinload(CourtSlot.slot_definition).selectinload(SlotDefinition.court)
        )
        .order_by(Booking.booked_at.desc())
        .limit(50)
    )
    bookings = []
    for b in result.scalars():
        slot_def = b.court_slot.slot_definition
        bookings.append({
            "id": str(b.id),
            "status": b.status,
            "amount_charged": float(b.amount_charged),
            "booked_at": b.booked_at.isoformat(),
            "court_name": slot_def.court.name,
            "play_date": str(b.court_slot.play_date),
            "start_time": str(slot_def.start_time),
            "end_time": str(slot_def.end_time),
        })
    return bookings


@router.delete("/{booking_id}")
async def cancel(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = await cancel_booking(db, booking_id, current_user.id)
    return {"message": "Đã huỷ đặt sân và hoàn tiền vào ví", "booking_id": str(booking.id)}
