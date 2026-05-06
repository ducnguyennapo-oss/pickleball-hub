import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("user_id", "court_slot_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    court_slot_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("court_slots.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="confirmed", nullable=False)
    # confirmed | cancelled | attended | no_show
    amount_charged: Mapped[Decimal] = mapped_column(Numeric(10, 0), nullable=False)
    txn_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("wallet_transactions.id"), nullable=True)
    booked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="bookings")
    court_slot: Mapped["CourtSlot"] = relationship("CourtSlot", back_populates="bookings")
    transaction: Mapped["WalletTransaction | None"] = relationship("WalletTransaction", foreign_keys=[txn_id])
    attendance: Mapped["Attendance | None"] = relationship("Attendance", back_populates="booking", uselist=False)
