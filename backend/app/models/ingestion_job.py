from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampedMixin, UUIDPrimaryKeyMixin


class IngestionJob(Base, UUIDPrimaryKeyMixin, TimestampedMixin):
    __tablename__ = "ingestion_jobs"

    job_type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), index=True, default="queued", nullable=False)

    machine_type: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    detail: Mapped[str] = mapped_column(Text, default="", nullable=False)

    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    error: Mapped[str] = mapped_column(Text, default="", nullable=False)
