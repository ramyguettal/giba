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
from app.utils.document_processing import (
    chunk_with_metadata,
    detect_doc_type,
    ensure_dir,
    extract_text_from_file,
)


def _check_duplicate(
    repo: IngestionRepository, job_type: str, title: str, machine_type: str
) -> IngestionJob | None:
    return repo.find_by_type_title_machine(job_type, title, machine_type)


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
            source = "manufacturer" if job_type == "manufacturer-alert" else "manual"

            # ── Extract raw text ──────────────────────────────────────────────
            file_path = str(payload.get("file_path") or "")
            page_meta: list[dict] = []

            if file_path and os.path.exists(file_path):
                full_text, page_meta = extract_text_from_file(file_path)
            else:
                full_text = str(payload.get("detail") or "")
                page_meta = []

            if not full_text.strip():
                raise RuntimeError("No text could be extracted for ingestion")

            # ── Detect document type ──────────────────────────────────────────
            doc_type = detect_doc_type(
                title=job.title,
                text_preview=full_text[:600],
                job_type=job_type,
            )

            # ── Type-aware chunking with per-chunk metadata ───────────────────
            base_meta = {
                "source": source,
                "machine_type": machine_type,
                "job_id": job.id,
                "title": job.title,
                "doc_type": doc_type,
            }
            chunks_with_meta = chunk_with_metadata(
                full_text,
                doc_type=doc_type,
                page_meta=page_meta,
                base_metadata=base_meta,
            )

            if not chunks_with_meta:
                raise RuntimeError("No usable chunks extracted")

            texts = [c for c, _ in chunks_with_meta]
            metadatas = [m for _, m in chunks_with_meta]
            ids = [f"{job.id}:{i}" for i in range(len(texts))]

            # ── Embed and upsert ──────────────────────────────────────────────
            embedder = EmbeddingService()
            vectors = embedder.embed_texts(texts, input_type="document")

            vstore = VectorStoreClient(db=self.db)
            vstore.upsert_documents(
                ids=ids,
                documents=texts,
                embeddings=vectors,
                metadatas=metadatas,
            )

            self.repo.update_status(
                job.id,
                status="completed",
                error=f"Indexed {len(texts)} chunks (type: {doc_type})",
            )
        except Exception as exc:
            self.repo.update_status(job.id, status="failed", error=str(exc))

    def enqueue_manufacturer_alert(
        self,
        *,
        user: UserContext,
        payload: ManufacturerAlertRequest,
        idempotency_key: str,
        file: UploadFile | None = None,
    ) -> IngestionJob:
        self._validate_machine_access(user, payload.machine_type)

        existing = _check_duplicate(self.repo, "manufacturer-alert", payload.title, payload.machine_type)
        if existing:
            return existing

        file_path = ""
        if file and file.filename:
            uploads_dir = "./data/uploads"
            ensure_dir(uploads_dir)
            suffix = Path(file.filename).suffix.lower() or ".txt"
            file_path = str(Path(uploads_dir) / f"{idempotency_key}{suffix}")
            with open(file_path, "wb") as f:
                f.write(file.file.read())

        job = IngestionJob(
            job_type="manufacturer-alert",
            status="queued",
            machine_type=payload.machine_type,
            title=payload.title,
            detail=payload.detail or (f"File: {file.filename}" if file else "Alert submitted"),
            payload={
                "type": "manufacturer-alert",
                "title": payload.title,
                "machine_type": payload.machine_type,
                "detail": payload.detail,
                "file_path": file_path,
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
        if file and file.filename:
            uploads_dir = "./data/uploads"
            ensure_dir(uploads_dir)
            suffix = Path(file.filename).suffix.lower() or ".pdf"
            file_path = str(Path(uploads_dir) / f"{idempotency_key}{suffix}")
            with open(file_path, "wb") as f:
                f.write(file.file.read())

        job = IngestionJob(
            job_type="manual",
            status="queued",
            machine_type=machine_type,
            title=title,
            detail=detail or (f"File: {file.filename}" if file else "Manual queued for indexing."),
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
