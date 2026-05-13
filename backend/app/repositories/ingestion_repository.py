from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.ingestion_job import IngestionJob


class IngestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, job: IngestionJob) -> IngestionJob:
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get(self, job_id: str) -> IngestionJob | None:
        return self.db.query(IngestionJob).filter(IngestionJob.id == job_id).first()

    def find_by_type_title_machine(self, job_type: str, title: str, machine_type: str) -> IngestionJob | None:
        return (
            self.db.query(IngestionJob)
            .filter(
                IngestionJob.job_type == job_type,
                IngestionJob.title == title,
                IngestionJob.machine_type == machine_type,
            )
            .first()
        )

    def update_status(self, job_id: str, *, status: str, error: str = "") -> None:
        job = self.get(job_id)
        if not job:
            return
        job.status = status
        job.error = error
        self.db.add(job)
        self.db.commit()

    def count_active(self) -> int:
        return self.db.query(IngestionJob).filter(~IngestionJob.status.in_(["completed", "failed"])).count()

    def get_recent(self, limit: int = 10) -> list[IngestionJob]:
        return self.db.query(IngestionJob).order_by(IngestionJob.created_at.desc()).limit(limit).all()
