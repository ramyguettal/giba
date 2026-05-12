"""add vector_documents (pgvector)

Revision ID: 0002_vector_documents
Revises: 0001_initial
Create Date: 2026-05-10

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from pgvector.sqlalchemy import Vector

revision = "0002_vector_documents"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # pgvector extension (must exist for Vector column type)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "vector_documents",
        sa.Column("id", sa.String(length=128), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("machine_type", sa.String(length=120), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("document", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("embedding", Vector(384), nullable=False),
    )

    op.create_index("ix_vector_documents_machine_type", "vector_documents", ["machine_type"])
    op.create_index("ix_vector_documents_source", "vector_documents", ["source"])


def downgrade() -> None:
    op.drop_table("vector_documents")
    op.execute("DROP EXTENSION IF EXISTS vector")
