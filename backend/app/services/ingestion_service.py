from __future__ import annotations

import os
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.clients.vector_store_client import VectorStoreClient
from app.core.exceptions import ForbiddenError, NotFoundError
from app.core.security import UserContext
from app.models.ingestion_job import IngestionJob
from app.repositories.ingestion_repository import IngestionRepository
from app.schemas.ingestion import ManufacturerAlertRequest
from app.services.embedding_service import EmbeddingService
from app.utils.document_processing import chunk_text, ensure_dir, extract_text_from_pdf


def _check_duplicate(repo: IngestionRepository, job_type: str, title: str, machine_type: str) -> IngestionJob | None:
    existing = repo.find_by_type_title_machine(job_type, title, machine_type)
    if existing:
        return existing
    return None


class IngestionService:
    def __init__(self, *, db: Session):
        self.db = db
        self.repo = IngestionRepository(db)

    @staticmethod
    def _validate_machine_access(user: UserContext, machine_type: str) -> None:
        if machine_type not in (user.allowed_machines or []):
            raise ForbiddenError("Machine scope is not allowed")

    def _process_job(self, job: IngestionJob) -> None:
        self.repo.update_status(job.id, status="processing")

        try:
            payload = job.payload or {}
            job_type = payload.get("type") or job.job_type
            machine_type = job.machine_type

            texts: list[str] = []
            source = "manufacturer" if job_type == "manufacturer-alert" else "manual"

            if job_type == "manufacturer-alert":
                texts = chunk_text(str(payload.get("detail") or job.detail))
            elif job_type == "manual":
                file_path = str(payload.get("file_path") or "")
                if file_path and file_path.lower().endswith(".pdf"):
                    full_text = extract_text_from_pdf(file_path)
                elif file_path and os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        full_text = f.read()
                else:
                    full_text = str(payload.get("detail") or "")
                texts = chunk_text(full_text)
            else:
                texts = chunk_text(str(payload.get("detail") or ""))

            if not texts:
                raise RuntimeError("No text extracted for ingestion")

            embedder = EmbeddingService()
            vectors = embedder.embed_texts(texts)

            vstore = VectorStoreClient(db=self.db)
            ids = [f"{job.id}:{i}" for i in range(len(texts))]
            metadatas = [
                {
                    "source": source,
                    "machine_type": machine_type,
                    "job_id": job.id,
                    "title": job.title,
                    "chunk_index": i,
                }
                for i in range(len(texts))
            ]
            vstore.upsert_documents(ids=ids, documents=texts, embeddings=vectors, metadatas=metadatas)

            self.repo.update_status(job.id, status="completed")
        except Exception as exc:
            self.repo.update_status(job.id, status="failed", error=str(exc))

    def enqueue_manufacturer_alert(
        self,
        *,
        user: UserContext,
        payload: ManufacturerAlertRequest,
        idempotency_key: str,
    ) -> IngestionJob:
        self._validate_machine_access(user, payload.machine_type)

        existing = _check_duplicate(self.repo, "manufacturer-alert", payload.title, payload.machine_type)
        if existing:
            return existing

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
        self._process_job(job)
        return self.repo.get(job.id)

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

        existing = _check_duplicate(self.repo, "manual", title, machine_type)
        if existing:
            return existing

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
        self._process_job(job)
        return self.repo.get(job.id)

    def get_job(self, job_id: str) -> IngestionJob:
        job = self.repo.get(job_id)
        if not job:
            raise NotFoundError("Job not found")
        return job
