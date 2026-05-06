import uuid
from datetime import date, time, datetime
from pydantic import BaseModel


class SlotDefinitionResponse(BaseModel):
    id: uuid.UUID
    slot_index: int
    start_time: time
    end_time: time
    price: float
    max_players: int

    model_config = {"from_attributes": True}


class CourtResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class CourtWithSlots(CourtResponse):
    slot_definitions: list[SlotDefinitionResponse]


class CourtSlotResponse(BaseModel):
    id: uuid.UUID
    slot_def_id: uuid.UUID
    play_date: date
    status: str
    current_players: int
    max_players: int
    price: float
    start_time: time
    end_time: time
    court_id: uuid.UUID
    court_name: str

    model_config = {"from_attributes": True}


class CourtAvailabilityResponse(BaseModel):
    court: CourtResponse
    slots: list[CourtSlotResponse]


class CreateCourtRequest(BaseModel):
    name: str
    description: str | None = None


class CreateSlotDefinitionRequest(BaseModel):
    slot_index: int
    start_time: time
    end_time: time
    price: float
    max_players: int = 4
