from __future__ import annotations

import json
import os

import redis
from sqlalchemy.orm import Session

from app.clients.vector_store_client import VectorStoreClient
from app.core.config import settings
from app.database.session import SessionLocal
from app.models.ingestion_job import IngestionJob
from app.repositories.ingestion_repository import IngestionRepository
from app.services.embedding_service import EmbeddingService
from app.utils.document_processing import chunk_text, extract_text_from_pdf


def process_job(db: Session, redis_client: redis.Redis, job_id: str) -> None:
    repo = IngestionRepository(db)
    job = repo.get(job_id)
    if not job:
        return

    repo.update_status(job_id, status="processing")

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

        vstore = VectorStoreClient(db=db)
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

        repo.update_status(job.id, status="completed")
    except Exception as exc:
        repo.update_status(job.id, status="failed", error=str(exc))


def main() -> None:
    redis_client = redis.Redis.from_url(settings.get_redis_url(), decode_responses=True)

    while True:
        item = redis_client.brpop("ingestion:jobs", timeout=5)
        if not item:
            continue
        _, raw = item
        try:
            msg = json.loads(raw)
            job_id = str(msg.get("job_id"))
        except Exception:
            continue

        db = SessionLocal()
        try:
            process_job(db, redis_client, job_id)
        finally:
            db.close()


if __name__ == "__main__":
    main()
