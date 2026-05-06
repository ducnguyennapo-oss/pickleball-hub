"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(15), unique=True, nullable=False),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("zalo_uid", sa.String(50), nullable=True),
        sa.Column("is_admin", sa.Boolean(), default=False, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_phone", "users", ["phone"])

    op.create_table(
        "otp_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(15), nullable=False),
        sa.Column("otp_code", sa.String(6), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_otp_phone", "otp_sessions", ["phone", "expires_at"])

    op.create_table(
        "wallets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("balance", sa.Numeric(12, 0), default=0, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "wallet_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("wallet_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wallets.id"), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("amount", sa.Numeric(12, 0), nullable=False),
        sa.Column("balance_after", sa.Numeric(12, 0), nullable=False),
        sa.Column("ref_id", sa.String(100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_wallet_txn", "wallet_transactions", ["wallet_id", "created_at"])

    op.create_table(
        "courts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "slot_definitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("court_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slot_index", sa.SmallInteger(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("price", sa.Numeric(10, 0), nullable=False),
        sa.Column("max_players", sa.SmallInteger(), default=4, nullable=False),
        sa.UniqueConstraint("court_id", "slot_index"),
    )

    op.create_table(
        "court_slots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slot_def_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("slot_definitions.id"), nullable=False),
        sa.Column("play_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(20), default="available", nullable=False),
        sa.Column("current_players", sa.SmallInteger(), default=0, nullable=False),
        sa.Column("notified_full", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("slot_def_id", "play_date"),
    )
    op.create_index("ix_court_slot_date", "court_slots", ["play_date", "slot_def_id"])

    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("court_slot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("court_slots.id"), nullable=False),
        sa.Column("status", sa.String(20), default="confirmed", nullable=False),
        sa.Column("amount_charged", sa.Numeric(10, 0), nullable=False),
        sa.Column("txn_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wallet_transactions.id"), nullable=True),
        sa.Column("booked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "court_slot_id"),
    )
    op.create_index("ix_booking_user", "bookings", ["user_id", "booked_at"])
    op.create_index("ix_booking_slot", "bookings", ["court_slot_id"])

    op.create_table(
        "attendance",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("bookings.id"), unique=True, nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("checked_in_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("attendance")
    op.drop_table("bookings")
    op.drop_table("court_slots")
    op.drop_table("slot_definitions")
    op.drop_table("courts")
    op.drop_table("wallet_transactions")
    op.drop_table("wallets")
    op.drop_table("otp_sessions")
    op.drop_table("users")
