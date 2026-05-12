from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampedMixin, UUIDPrimaryKeyMixin


class Report(Base, UUIDPrimaryKeyMixin, TimestampedMixin):
    __tablename__ = "reports"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    machine_type: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    # Raw structured fields
    problem: Mapped[str] = mapped_column(Text, nullable=False)
    cause: Mapped[str] = mapped_column(Text, nullable=False)
    solution: Mapped[str] = mapped_column(Text, nullable=False)

    # Clean fields (LLM output)
    clean_problem: Mapped[str] = mapped_column(Text, nullable=False)
    clean_cause: Mapped[str] = mapped_column(Text, nullable=False)
    clean_solution: Mapped[str] = mapped_column(Text, nullable=False)

    combined_clean_text: Mapped[str] = mapped_column(Text, nullable=False)

    source: Mapped[str] = mapped_column(String(32), default="repairer", index=True, nullable=False)

    # Optional metadata (plant/line/etc)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
