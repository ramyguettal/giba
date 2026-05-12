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

    def update_status(self, job_id: str, *, status: str, error: str = "") -> None:
        job = self.get(job_id)
        if not job:
            return
        job.status = status
        job.error = error
        self.db.add(job)
        self.db.commit()
