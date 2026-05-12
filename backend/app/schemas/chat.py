from __future__ import annotations

from pydantic import BaseModel, Field


class ChatQueryRequest(BaseModel):
    question: str = Field(min_length=1)
    machine_type: str | None = None
    locale: str | None = None
    top_k: int = 5


class Citation(BaseModel):
    chunk_id: str
    source: str
    machine_type: str
    snippet: str
    score: float | None = None


class ChatQueryResponse(BaseModel):
    answer: str
    confidence: float
    citations: list[Citation]
    mode: str = "answer"  # or 'clarify'
