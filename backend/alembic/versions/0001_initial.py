"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2026-05-06

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("username", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("allowed_machines", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("machine_type", sa.String(length=120), nullable=False),
        sa.Column("problem", sa.Text(), nullable=False),
        sa.Column("cause", sa.Text(), nullable=False),
        sa.Column("solution", sa.Text(), nullable=False),
        sa.Column("clean_problem", sa.Text(), nullable=False),
        sa.Column("clean_cause", sa.Text(), nullable=False),
        sa.Column("clean_solution", sa.Text(), nullable=False),
        sa.Column("combined_clean_text", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    )
    op.create_index("ix_reports_user_id", "reports", ["user_id"])
    op.create_index("ix_reports_machine_type", "reports", ["machine_type"])
    op.create_index("ix_reports_source", "reports", ["source"])

    op.create_table(
        "audit_traces",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("machine_type", sa.String(length=120), nullable=True),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("response", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("retrieved_chunk_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("retrieved_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    )
    op.create_index("ix_audit_traces_user_id", "audit_traces", ["user_id"])
    op.create_index("ix_audit_traces_machine_type", "audit_traces", ["machine_type"])

    op.create_table(
        "ingestion_jobs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("job_type", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("machine_type", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("error", sa.Text(), nullable=False),
    )
    op.create_index("ix_ingestion_jobs_job_type", "ingestion_jobs", ["job_type"])
    op.create_index("ix_ingestion_jobs_status", "ingestion_jobs", ["status"])
    op.create_index("ix_ingestion_jobs_machine_type", "ingestion_jobs", ["machine_type"])


def downgrade() -> None:
    op.drop_table("ingestion_jobs")
    op.drop_table("audit_traces")
    op.drop_table("reports")
    op.drop_table("users")
