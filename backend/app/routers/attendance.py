import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.booking import Booking
from app.models.attendance import Attendance
from app.models.court import CourtSlot

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/{booking_id}/checkin")
async def checkin(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    booking = await db.scalar(select(Booking).where(Booking.id == booking_id))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking không tồn tại")
    if booking.status not in ("confirmed",):
        raise HTTPException(status_code=409, detail="Không thể điểm danh booking này")

    existing = await db.scalar(select(Attendance).where(Attendance.booking_id == booking_id))
    if existing:
        raise HTTPException(status_code=409, detail="Đã điểm danh rồi")

    att = Attendance(booking_id=booking_id, checked_in_by=admin.id)
    db.add(att)
    booking.status = "attended"
    await db.commit()
    return {"message": "Điểm danh thành công"}


@router.get("/slot/{court_slot_id}")
async def slot_attendance(
    court_slot_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Booking)
        .where(Booking.court_slot_id == court_slot_id)
        .options(selectinload(Booking.attendance), selectinload(Booking.user))
    )
    return [
        {
            "booking_id": str(b.id),
            "user_name": b.user.full_name,
            "phone": b.user.phone,
            "status": b.status,
            "checked_in": b.attendance is not None,
            "checked_in_at": b.attendance.checked_in_at.isoformat() if b.attendance else None,
        }
        for b in result.scalars()
    ]
