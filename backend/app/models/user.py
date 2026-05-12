from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampedMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampedMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="repairer", index=True, nullable=False)

    # Example: ["machineA", "machineB"]
    allowed_machines: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
