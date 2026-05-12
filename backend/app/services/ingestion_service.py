from __future__ import annotations

import json
from pathlib import Path

import redis
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.security import UserContext
from app.models.ingestion_job import IngestionJob
from app.repositories.ingestion_repository import IngestionRepository
from app.schemas.ingestion import ManufacturerAlertRequest
from app.utils.document_processing import ensure_dir
from app.utils.idempotency import IdempotencyStore


class IngestionService:
    QUEUE_NAME = "ingestion:jobs"

    def __init__(self, *, db: Session, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client
        self.repo = IngestionRepository(db)
        self.idempotency = IdempotencyStore(redis_client)

    @staticmethod
    def _validate_machine_access(user: UserContext, machine_type: str) -> None:
        if machine_type not in (user.allowed_machines or []):
            raise ForbiddenError("Machine scope is not allowed")

    def enqueue_manufacturer_alert(
        self,
        *,
        user: UserContext,
        payload: ManufacturerAlertRequest,
        idempotency_key: str,
    ) -> IngestionJob:
        self._validate_machine_access(user, payload.machine_type)

        scope = "ingestion:manufacturer-alert"
        cached = self.idempotency.get(scope=scope, key=idempotency_key)
        if cached and cached.get("job_id"):
            job = self.repo.get(str(cached["job_id"]))
            if job:
                return job

        job = IngestionJob(
            job_type="manufacturer-alert",
            status="queued",
            machine_type=payload.machine_type,
            title=payload.title,
            detail=payload.detail,
            payload={
                "type": "manufacturer-alert",
                "title": payload.title,
                "machine_type": payload.machine_type,
                "detail": payload.detail,
            },
            error="",
        )
        job = self.repo.create(job)

        self.redis.lpush(self.QUEUE_NAME, json.dumps({"job_id": job.id, "type": "manufacturer-alert"}))
        self.idempotency.set(scope=scope, key=idempotency_key, value={"job_id": job.id})
        return job

    def enqueue_manual(
        self,
        *,
        user: UserContext,
        title: str,
        machine_type: str,
        detail: str,
        file: UploadFile | None,
        idempotency_key: str,
    ) -> IngestionJob:
        self._validate_machine_access(user, machine_type)

        scope = "ingestion:manual"
        cached = self.idempotency.get(scope=scope, key=idempotency_key)
        if cached and cached.get("job_id"):
            job = self.repo.get(str(cached["job_id"]))
            if job:
                return job

        file_path = ""
        if file:
            uploads_dir = "./data/uploads"
            ensure_dir(uploads_dir)
            suffix = Path(file.filename or "manual.pdf").suffix
            file_path = str(Path(uploads_dir) / f"{idempotency_key}{suffix}")
            with open(file_path, "wb") as f:
                f.write(file.file.read())

        job = IngestionJob(
            job_type="manual",
            status="queued",
            machine_type=machine_type,
            title=title,
            detail=detail or "Manual queued for indexing.",
            payload={
                "type": "manual",
                "title": title,
                "machine_type": machine_type,
                "detail": detail,
                "file_path": file_path,
                "filename": file.filename if file else None,
            },
            error="",
        )
        job = self.repo.create(job)

        self.redis.lpush(self.QUEUE_NAME, json.dumps({"job_id": job.id, "type": "manual"}))
        self.idempotency.set(scope=scope, key=idempotency_key, value={"job_id": job.id})
        return job

    def get_job(self, job_id: str) -> IngestionJob:
        job = self.repo.get(job_id)
        if not job:
            raise NotFoundError("Job not found")
        return job
