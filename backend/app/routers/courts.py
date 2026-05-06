from datetime import date
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.court import Court, SlotDefinition, CourtSlot

router = APIRouter(prefix="/courts", tags=["courts"])


@router.get("/")
async def list_courts(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    courts = await db.execute(
        select(Court).where(Court.is_active == True).order_by(Court.name)
    )
    return [{"id": str(c.id), "name": c.name, "description": c.description} for c in courts.scalars()]


@router.get("/availability")
async def all_courts_availability(
    play_date: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not play_date:
        play_date = date.today()

    courts = await db.execute(
        select(Court)
        .where(Court.is_active == True)
        .options(selectinload(Court.slot_definitions))
        .order_by(Court.name)
    )
    result = []
    for court in courts.scalars():
        slots = []
        for slot_def in sorted(court.slot_definitions, key=lambda s: s.slot_index):
            # Get or create court_slot for this date
            court_slot = await db.scalar(
                select(CourtSlot).where(
                    CourtSlot.slot_def_id == slot_def.id,
                    CourtSlot.play_date == play_date,
                )
            )
            if not court_slot:
                court_slot = CourtSlot(slot_def_id=slot_def.id, play_date=play_date)
                db.add(court_slot)
                await db.flush()

            slots.append({
                "id": str(court_slot.id),
                "slot_index": slot_def.slot_index,
                "start_time": str(slot_def.start_time),
                "end_time": str(slot_def.end_time),
                "price": float(slot_def.price),
                "max_players": slot_def.max_players,
                "current_players": court_slot.current_players,
                "status": court_slot.status,
            })
        await db.commit()
        result.append({"court": {"id": str(court.id), "name": court.name}, "slots": slots})
    return result


@router.get("/{court_id}/slots")
async def court_slots(
    court_id: uuid.UUID,
    play_date: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not play_date:
        play_date = date.today()

    court = await db.scalar(select(Court).where(Court.id == court_id))
    if not court:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sân không tồn tại")

    slot_defs = await db.execute(
        select(SlotDefinition)
        .where(SlotDefinition.court_id == court_id)
        .order_by(SlotDefinition.slot_index)
    )
    slots = []
    for slot_def in slot_defs.scalars():
        court_slot = await db.scalar(
            select(CourtSlot).where(
                CourtSlot.slot_def_id == slot_def.id,
                CourtSlot.play_date == play_date,
            )
        )
        if not court_slot:
            court_slot = CourtSlot(slot_def_id=slot_def.id, play_date=play_date)
            db.add(court_slot)
            await db.flush()
        slots.append({
            "id": str(court_slot.id),
            "slot_index": slot_def.slot_index,
            "start_time": str(slot_def.start_time),
            "end_time": str(slot_def.end_time),
            "price": float(slot_def.price),
            "max_players": slot_def.max_players,
            "current_players": court_slot.current_players,
            "status": court_slot.status,
        })
    await db.commit()
    return {"court": {"id": str(court.id), "name": court.name}, "slots": slots}
