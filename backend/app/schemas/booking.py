import uuid
from datetime import datetime
from pydantic import BaseModel


class CreateBookingRequest(BaseModel):
    court_slot_id: uuid.UUID


class BookingResponse(BaseModel):
    id: uuid.UUID
    court_slot_id: uuid.UUID
    status: str
    amount_charged: float
    booked_at: datetime
    cancelled_at: datetime | None
    court_name: str
    play_date: str
    start_time: str
    end_time: str

    model_config = {"from_attributes": True}
