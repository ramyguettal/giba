from __future__ import annotations

from sqlalchemy.orm import Session

from app.clients.vector_store_client import VectorStoreClient
from app.services.embedding_service import EmbeddingService


class RagService:
    def __init__(
        self,
        *,
        db: Session | None = None,
        vector_store: VectorStoreClient | None = None,
        embedding_service: EmbeddingService | None = None,
    ):
        self.vector_store = vector_store or VectorStoreClient(db=db)
        self.embeddings = embedding_service or EmbeddingService()

    def retrieve(
        self,
        *,
        query: str,
        where: dict | None,
        top_k: int,
    ) -> list[dict]:
        query_vec = self.embeddings.embed_text(query)
        raw = self.vector_store.query(query_embedding=query_vec, where=where, top_k=top_k)

        ids = (raw.get("ids") or [[]])[0]
        docs = (raw.get("documents") or [[]])[0]
        metas = (raw.get("metadatas") or [[]])[0]
        dists = (raw.get("distances") or [[]])[0]

        results = []
        for chunk_id, doc, meta, dist in zip(ids, docs, metas, dists):
            # cosine distance in [0..2] sometimes; with normalized embeddings it is [0..2].
            score = 1.0 - float(dist)
            results.append(
                {
                    "chunk_id": str(chunk_id),
                    "text": str(doc),
                    "metadata": dict(meta or {}),
                    "score": score,
                }
            )
        return results

    def compute_confidence(self, results: list[dict]) -> float:
        if not results:
            return 0.0
        top = float(results[0].get("score") or 0.0)
        second = float(results[1].get("score") or 0.0) if len(results) > 1 else 0.0
        gap = max(0.0, top - second)
        # Simple heuristic: weigh top score and separation
        return max(0.0, min(1.0, 0.8 * top + 0.2 * gap))
