"""
Seed script: creates 10 courts with 6 time slots each.
Run: python -m app.scripts.seed_data
"""
import asyncio
import uuid
from decimal import Decimal
from datetime import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.court import Court, SlotDefinition

COURTS = [f"Sân {i}" for i in range(1, 11)]

# 6 time slots per court (price varies by time)
SLOT_TEMPLATES = [
    {"slot_index": 1, "start_time": time(6, 0), "end_time": time(7, 30), "price": Decimal("30000"), "max_players": 4},
    {"slot_index": 2, "start_time": time(7, 30), "end_time": time(9, 0), "price": Decimal("35000"), "max_players": 4},
    {"slot_index": 3, "start_time": time(9, 0), "end_time": time(10, 30), "price": Decimal("30000"), "max_players": 4},
    {"slot_index": 4, "start_time": time(16, 0), "end_time": time(17, 30), "price": Decimal("35000"), "max_players": 4},
    {"slot_index": 5, "start_time": time(17, 30), "end_time": time(19, 0), "price": Decimal("45000"), "max_players": 4},
    {"slot_index": 6, "start_time": time(19, 0), "end_time": time(20, 30), "price": Decimal("50000"), "max_players": 4},
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing = await db.scalar(select(Court))
        if existing:
            print("Courts already seeded, skipping.")
            return

        for court_name in COURTS:
            court = Court(name=court_name)
            db.add(court)
            await db.flush()

            for tmpl in SLOT_TEMPLATES:
                slot_def = SlotDefinition(court_id=court.id, **tmpl)
                db.add(slot_def)

        await db.commit()
        print(f"Seeded {len(COURTS)} courts with {len(SLOT_TEMPLATES)} slots each.")


if __name__ == "__main__":
    asyncio.run(seed())
