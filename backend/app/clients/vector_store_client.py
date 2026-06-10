from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.database.session import SessionLocal
from app.models.vector_document import VectorDocument


class VectorStoreClient:
    """Postgres-backed vector store using pgvector.

    This replaces the previous Chroma-based implementation so vectors and relational
    data live in the same Postgres database.
    """

    def __init__(self, *, db: Session | None = None):
        self._db = db

    @contextmanager
    def _db_session(self):
        if self._db is not None:
            yield self._db
            return

        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def upsert_documents(
        self,
        *,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> None:
        if not (len(ids) == len(documents) == len(embeddings) == len(metadatas)):
            raise ValueError("ids, documents, embeddings, metadatas must have the same length")

        rows = []
        for doc_id, text, embedding, meta in zip(ids, documents, embeddings, metadatas):
            meta = dict(meta or {})
            machine_type = str(meta.get("machine_type") or "")
            source = str(meta.get("source") or "unknown")
            now = datetime.utcnow()
            rows.append(
                {
                    "id": str(doc_id),
                    "machine_type": machine_type,
                    "source": source,
                    "document": str(text),
                    "metadata": meta,
                    "embedding": embedding,
                    "created_at": now,
                    "updated_at": now,
                }
            )

        with self._db_session() as db:
            # Insert against the Core table (not the ORM class): the row key
            # "metadata" maps cleanly to the column, whereas the ORM class
            # attribute `metadata` is SQLAlchemy's Declarative MetaData.
            table = VectorDocument.__table__
            stmt = insert(table).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=[table.c.id],
                set_={
                    "machine_type": stmt.excluded.machine_type,
                    "source": stmt.excluded.source,
                    "document": stmt.excluded.document,
                    "metadata": stmt.excluded.metadata,
                    "embedding": stmt.excluded.embedding,
                    "updated_at": func.now(),
                },
            )
            db.execute(stmt)
            db.commit()

    def delete_documents(self, *, ids: list[str], include_chunks: bool = True) -> None:
        """Delete documents by id. With include_chunks, also removes chunked
        entries stored as "{id}:{chunk_index}"."""
        if not ids:
            return

        from sqlalchemy import delete, or_

        table = VectorDocument.__table__
        conditions = [table.c.id.in_([str(i) for i in ids])]
        if include_chunks:
            conditions.extend(table.c.id.like(f"{i}:%") for i in ids)

        with self._db_session() as db:
            db.execute(delete(table).where(or_(*conditions)))
            db.commit()

    def query(
        self,
        *,
        query_embedding: list[float],
        where: dict | None,
        top_k: int,
    ) -> dict:
        if top_k <= 0:
            return {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}

        filters = []
        if where:
            # Minimal compatibility with the Chroma-style filter used in this codebase.
            # Supported forms:
            # - {"machine_type": "X"}
            # - {"machine_type": {"$in": ["A", "B"]}}
            machine = where.get("machine_type")
            if isinstance(machine, dict) and "$in" in machine:
                values = [str(v) for v in (machine.get("$in") or [])]
                if values:
                    filters.append(VectorDocument.machine_type.in_(values))
            elif isinstance(machine, str):
                filters.append(VectorDocument.machine_type == machine)

        distance = VectorDocument.embedding.cosine_distance(query_embedding).label("distance")

        stmt = (
            select(
                VectorDocument.id,
                VectorDocument.document,
                VectorDocument.metadata_,
                distance,
            )
            .where(*filters)
            .order_by(distance.asc())
            .limit(top_k)
        )

        with self._db_session() as db:
            rows = db.execute(stmt).all()

        ids: list[str] = []
        docs: list[str] = []
        metas: list[dict] = []
        dists: list[float] = []

        for doc_id, doc, meta, dist in rows:
            ids.append(str(doc_id))
            docs.append(str(doc))
            metas.append(dict(meta or {}))
            dists.append(float(dist))

        # Keep a Chroma-like response shape for compatibility with RagService.
        return {"ids": [ids], "documents": [docs], "metadatas": [metas], "distances": [dists]}
