from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.core.security import UserContext
from app.models.audit_trace import AuditTrace
from app.repositories.audit_repository import AuditRepository
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse, Citation
from app.services.genrative_ai_services import GenrativeAIServices
from app.services.rag_service import RagService


class ChatService:
    def __init__(self, *, db: Session, rag: RagService | None = None, ai: GenrativeAIServices | None = None):
        self.db = db
        self.rag = rag or RagService(db=db)
        self.ai = ai or GenrativeAIServices()
        self.audit = AuditRepository(db)

    @staticmethod
    def _build_where(user: UserContext, machine_type: str | None) -> dict:
        allowed = list(user.allowed_machines or [])
        if machine_type:
            if machine_type not in allowed:
                raise ForbiddenError("You are not authorized to query this machine scope")
            return {"machine_type": machine_type}
        # Default: restrict to allowed machines
        if not allowed:
            return {"machine_type": "__none__"}
        return {"machine_type": {"$in": allowed}}

    def query(self, *, user: UserContext, req: ChatQueryRequest) -> ChatQueryResponse:
        where = self._build_where(user, req.machine_type)
        results = self.rag.retrieve(query=req.question, where=where, top_k=req.top_k)
        confidence = self.rag.compute_confidence(results)

        citations = []
        retrieved_ids = []
        retrieved_meta = []
        context = []
        for r in results:
            meta = r.get("metadata") or {}
            retrieved_ids.append(r["chunk_id"])
            retrieved_meta.append(meta)
            citations.append(
                Citation(
                    chunk_id=r["chunk_id"],
                    source=str(meta.get("source") or "unknown"),
                    machine_type=str(meta.get("machine_type") or ""),
                    snippet=str(r.get("text") or "")[:400],
                    score=float(r.get("score") or 0.0),
                )
            )
            context.append(
                {
                    "chunk_id": r["chunk_id"],
                    "text": str(r.get("text") or ""),
                    "source": str(meta.get("source") or "unknown"),
                    "machine_type": str(meta.get("machine_type") or ""),
                }
            )

        if confidence < 0.25:
            answer = (
                "I need a bit more detail to help. What is the exact machine model, "
                "error code (if any), and what symptoms do you observe?"
            )
            mode = "clarify"
        else:
            answer = self.ai.generate_grounded_answer(
                query=req.question,
                retrieved_context=context,
                locale=req.locale,
            )
            mode = "answer"

        trace = AuditTrace(
            user_id=user.id,
            machine_type=req.machine_type,
            query=req.question,
            response=answer,
            confidence=confidence,
            retrieved_chunk_ids=retrieved_ids,
            retrieved_metadata=retrieved_meta,
        )
        self.audit.create(trace)

        return ChatQueryResponse(answer=answer, confidence=confidence, citations=citations, mode=mode)