from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampedMixin, UUIDPrimaryKeyMixin


class AuditTrace(Base, UUIDPrimaryKeyMixin, TimestampedMixin):
    __tablename__ = "audit_traces"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    machine_type: Mapped[str] = mapped_column(String(120), index=True, nullable=True)

    query: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)

    confidence: Mapped[float] = mapped_column(default=0.0)

    retrieved_chunk_ids: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    retrieved_metadata: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)
