from __future__ import annotations

import time
from typing import Literal

import httpx

from app.core.config import settings
from app.core.exceptions import ValidationError

InputType = Literal["query", "document"]

_RETRY_DELAYS = (5.0, 15.0, 30.0)  # seconds between retries on 429


class EmbeddingService:
    """Text embedding service backed by the Voyage AI embeddings API.

    Voyage returns L2-normalized vectors, so cosine distance/similarity can be
    used directly by the pgvector store. ``input_type`` is forwarded to Voyage so
    queries and documents are embedded into the same, retrieval-optimized space.
    """

    def __init__(
        self,
        *,
        model_name: str | None = None,
        api_key: str | None = None,
    ):
        self.model_name = model_name or settings.VOYAGE_MODEL
        self.api_key = api_key if api_key is not None else settings.VOYAGE_API_KEY
        self.api_url = settings.VOYAGE_API_URL
        self.timeout = settings.VOYAGE_TIMEOUT
        self.batch_size = max(1, settings.VOYAGE_BATCH_SIZE)

    def embed_text(self, text: str, *, input_type: InputType = "query") -> list[float]:
        return self._embed([text], input_type=input_type)[0]

    def embed_texts(
        self, texts: list[str], *, input_type: InputType = "document"
    ) -> list[list[float]]:
        if not texts:
            return []
        return self._embed(texts, input_type=input_type)

    def _embed(self, inputs: list[str], *, input_type: InputType) -> list[list[float]]:
        if not self.api_key:
            raise ValidationError("VOYAGE_API_KEY is not configured")

        vectors: list[list[float]] = []
        for start in range(0, len(inputs), self.batch_size):
            batch = inputs[start : start + self.batch_size]
            vectors.extend(self._request_batch(batch, input_type=input_type))
        return vectors

    def _request_batch(
        self, batch: list[str], *, input_type: InputType
    ) -> list[list[float]]:
        payload = {
            "input": batch,
            "model": self.model_name,
            "input_type": input_type,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_exc: Exception | None = None
        for attempt, delay in enumerate([-1.0] + list(_RETRY_DELAYS)):
            if delay > 0:
                time.sleep(delay)
            try:
                response = httpx.post(
                    self.api_url, json=payload, headers=headers, timeout=self.timeout
                )
                if response.status_code == 429 and attempt < len(_RETRY_DELAYS):
                    last_exc = httpx.HTTPStatusError(
                        "rate limited", request=response.request, response=response
                    )
                    continue  # retry after delay
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                detail = exc.response.text[:500] if exc.response is not None else str(exc)
                if exc.response is not None and exc.response.status_code == 429 and attempt < len(_RETRY_DELAYS):
                    last_exc = exc
                    continue
                raise ValidationError(
                    "Voyage embeddings request failed", details={"response": detail}
                ) from exc
            except httpx.HTTPError as exc:
                raise ValidationError(
                    "Could not reach the Voyage embeddings API", details={"error": str(exc)}
                ) from exc

            data = response.json()
            items = sorted(data.get("data") or [], key=lambda item: item.get("index", 0))
            if len(items) != len(batch):
                raise ValidationError(
                    "Voyage returned an unexpected number of embeddings",
                    details={"expected": len(batch), "received": len(items)},
                )
            return [[float(x) for x in item["embedding"]] for item in items]

        raise ValidationError(
            "Voyage rate limit exceeded after retries",
            details={"error": str(last_exc)},
        )
