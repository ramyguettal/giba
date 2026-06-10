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

    def _embed_query(self, text: str) -> list[float]:
        return self.embeddings.embed_text(text, input_type="query")

    def retrieve(
        self,
        *,
        query: str,
        where: dict | None,
        top_k: int,
    ) -> list[dict]:
        # Primary retrieval
        primary_vec = self._embed_query(query)
        raw = self.vector_store.query(query_embedding=primary_vec, where=where, top_k=top_k)

        ids = (raw.get("ids") or [[]])[0]
        docs = (raw.get("documents") or [[]])[0]
        metas = (raw.get("metadatas") or [[]])[0]
        dists = (raw.get("distances") or [[]])[0]

        seen: dict[str, dict] = {}
        for chunk_id, doc, meta, dist in zip(ids, docs, metas, dists):
            score = max(0.0, 1.0 - float(dist))
            seen[str(chunk_id)] = {
                "chunk_id": str(chunk_id),
                "text": str(doc),
                "metadata": dict(meta or {}),
                "score": score,
            }

        # Expand with a reformulated version of the query to catch more relevant chunks.
        # This is cheap (one extra embedding) and significantly improves recall for
        # technical queries where phrasing varies a lot.
        expanded = self._expand_query(query)
        if expanded and expanded != query:
            exp_vec = self._embed_query(expanded)
            exp_raw = self.vector_store.query(query_embedding=exp_vec, where=where, top_k=max(4, top_k // 2))
            exp_ids = (exp_raw.get("ids") or [[]])[0]
            exp_docs = (exp_raw.get("documents") or [[]])[0]
            exp_metas = (exp_raw.get("metadatas") or [[]])[0]
            exp_dists = (exp_raw.get("distances") or [[]])[0]
            for chunk_id, doc, meta, dist in zip(exp_ids, exp_docs, exp_metas, exp_dists):
                score = max(0.0, 1.0 - float(dist))
                cid = str(chunk_id)
                if cid not in seen or seen[cid]["score"] < score:
                    seen[cid] = {
                        "chunk_id": cid,
                        "text": str(doc),
                        "metadata": dict(meta or {}),
                        "score": score,
                    }

        results = sorted(seen.values(), key=lambda x: x["score"], reverse=True)[:top_k]
        return results

    @staticmethod
    def _expand_query(query: str) -> str:
        q = query.strip()
        # Append maintenance-domain keywords to improve recall for common short queries.
        technical_terms = {
            "error": "fault code alarm diagnostic",
            "alarm": "fault error code diagnostic",
            "noise": "vibration sound mechanical",
            "slow": "performance speed cycle time",
            "heat": "temperature thermal overheat",
            "leak": "seal hydraulic fluid oil",
            "stuck": "jam blockage mechanical",
            "broken": "failure fault repair replace",
            "pressure": "hydraulic pneumatic bar psi",
        }
        q_lower = q.lower()
        additions: list[str] = []
        for kw, expansion in technical_terms.items():
            if kw in q_lower and expansion not in q_lower:
                additions.append(expansion)
                break
        return f"{q} {' '.join(additions)}".strip() if additions else q

    def compute_confidence(self, results: list[dict]) -> float:
        if not results:
            return 0.0
        scores = [float(r.get("score") or 0.0) for r in results]
        top = scores[0]
        second = scores[1] if len(scores) > 1 else 0.0
        avg = sum(scores[:3]) / min(3, len(scores))
        gap = max(0.0, top - second)
        # Weight top score most heavily, then average of top-3, then separation gap.
        raw = 0.55 * top + 0.30 * avg + 0.15 * gap
        return max(0.0, min(1.0, raw))

    @staticmethod
    def confidence_level(score: float) -> str:
        if score >= 0.60:
            return "high"
        if score >= 0.35:
            return "medium"
        return "low"
