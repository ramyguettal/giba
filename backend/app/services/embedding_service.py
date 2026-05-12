from __future__ import annotations

from app.core.config import settings


class EmbeddingService:
    _model: object | None = None

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME

    def _get_model(self):
        if EmbeddingService._model is None:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore
            except Exception as exc:  # pragma: no cover
                raise RuntimeError(
                    "sentence-transformers is required for embeddings. "
                    "Install it (and its torch dependency), or run with embeddings disabled."
                ) from exc

            EmbeddingService._model = SentenceTransformer(self.model_name)
        return EmbeddingService._model

    def embed_text(self, text: str) -> list[float]:
        model = self._get_model()
        vec = model.encode([text], normalize_embeddings=True)[0]
        return [float(x) for x in vec]

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        model = self._get_model()
        vecs = model.encode(texts, normalize_embeddings=True)
        return [[float(x) for x in vec] for vec in vecs]
