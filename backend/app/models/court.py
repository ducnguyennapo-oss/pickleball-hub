import uuid
from datetime import datetime, date, time
from decimal import Decimal
from sqlalchemy import String, Boolean, DateTime, Date, Time, SmallInteger, Numeric, ForeignKey, func, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Court(Base):
    __tablename__ = "courts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    slot_definitions: Mapped[list["SlotDefinition"]] = relationship(
        "SlotDefinition", back_populates="court", cascade="all, delete-orphan"
    )


class SlotDefinition(Base):
    """Template for 6 time slots per court — reused across all dates."""
    __tablename__ = "slot_definitions"
    __table_args__ = (UniqueConstraint("court_id", "slot_index"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    court_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courts.id", ondelete="CASCADE"), nullable=False)
    slot_index: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1-6
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 0), nullable=False)  # VND per player
    max_players: Mapped[int] = mapped_column(SmallInteger, default=4, nullable=False)

    court: Mapped["Court"] = relationship("Court", back_populates="slot_definitions")
    court_slots: Mapped[list["CourtSlot"]] = relationship("CourtSlot", back_populates="slot_definition")


class CourtSlot(Base):
    """Actual bookable slot for a specific date."""
    __tablename__ = "court_slots"
    __table_args__ = (UniqueConstraint("slot_def_id", "play_date"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slot_def_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("slot_definitions.id"), nullable=False, index=True)
    play_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="available", nullable=False)
    # available | partial | full | closed
    current_players: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    notified_full: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    slot_definition: Mapped["SlotDefinition"] = relationship("SlotDefinition", back_populates="court_slots")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="court_slot")
