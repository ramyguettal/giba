from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from pgvector.sqlalchemy import Vector

from app.models.base import Base, TimestampedMixin


class VectorDocument(Base, TimestampedMixin):
    __tablename__ = "vector_documents"

    # External id used by the app (e.g., report.id or "<job_id>:<chunk_index>")
    id: Mapped[str] = mapped_column(String(128), primary_key=True)

    # Commonly filtered metadata extracted into columns for simpler querying
    machine_type: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(32), index=True, nullable=False, default="unknown")

    document: Mapped[str] = mapped_column(Text, nullable=False)

    # Optional extra metadata (job_id, title, report_id, etc.)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    # Default embedding model in this repo is all-MiniLM-L6-v2 (384 dims).
    embedding: Mapped[list[float]] = mapped_column(Vector(384), nullable=False)
