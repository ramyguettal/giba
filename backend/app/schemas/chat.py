from __future__ import annotations

from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatQueryRequest(BaseModel):
    question: str = Field(min_length=1)
    machine_type: str | None = None
    locale: str | None = None
    top_k: int = 8
    history: list[HistoryMessage] = Field(default_factory=list)


class Citation(BaseModel):
    chunk_id: str
    source: str
    machine_type: str
    snippet: str
    score: float | None = None


class ChatQueryResponse(BaseModel):
    answer: str
    confidence: float
    confidence_level: str = "low"  # "high" | "medium" | "low"
    citations: list[Citation]
    mode: str = "answer"  # "answer" | "clarify"
