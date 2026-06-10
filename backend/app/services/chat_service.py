from __future__ import annotations

from sqlalchemy.orm import Session

from app.clients.ai_client import AIClientMessage
from app.core.exceptions import ForbiddenError
from app.core.security import UserContext
from app.models.audit_trace import AuditTrace
from app.repositories.audit_repository import AuditRepository
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse, Citation
from app.services.genrative_ai_services import GenrativeAIServices
from app.services.rag_service import RagService

_SYSTEM_PROMPT = """\
You are GIBA, an expert industrial maintenance assistant specializing in injection molding machines \
(Husky HyPET5e and similar). You provide precise, actionable diagnostic guidance to maintenance \
engineers and repair technicians.

Guidelines:
- Base every factual claim on the provided context chunks. Reference them as [chunk_id].
- Be concise but complete. Use bullet points for multi-step procedures.
- If the context is insufficient, ask a focused clarifying question — do not invent procedures.
- Always specify safety precautions when recommending physical interventions.
- Prefer metric units. Note if a step requires lockout/tagout (LOTO).
- Tailor language to the locale but keep technical terms in English.
"""


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
        if not allowed:
            return {"machine_type": "__none__"}
        return {"machine_type": {"$in": allowed}}

    def query(self, *, user: UserContext, req: ChatQueryRequest) -> ChatQueryResponse:
        where = self._build_where(user, req.machine_type)
        results = self.rag.retrieve(query=req.question, where=where, top_k=req.top_k)
        confidence = self.rag.compute_confidence(results)
        level = self.rag.confidence_level(confidence)

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
                    snippet=str(r.get("text") or "")[:500],
                    score=float(r.get("score") or 0.0),
                )
            )
            context.append(
                {
                    "chunk_id": r["chunk_id"],
                    "text": str(r.get("text") or ""),
                    "source": str(meta.get("source") or "unknown"),
                    "machine_type": str(meta.get("machine_type") or ""),
                    "score": float(r.get("score") or 0.0),
                }
            )

        if confidence < 0.20:
            answer = (
                "I need more detail to give you a reliable answer. "
                "Could you tell me the exact machine model, error code or alarm number "
                "(if displayed), and what specific symptom you're observing?"
            )
            mode = "clarify"
        elif self.ai.enabled:
            answer = self._generate_answer(req, context)
            mode = "answer"
        else:
            top = context[0]
            answer = (
                f"**Best match from knowledge base [{top['chunk_id']}]** "
                f"(confidence {round(confidence * 100)}%):\n\n{top['text']}"
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

        return ChatQueryResponse(
            answer=answer,
            confidence=confidence,
            confidence_level=level,
            citations=citations,
            mode=mode,
        )

    def _generate_answer(self, req: ChatQueryRequest, context: list[dict]) -> str:
        context_block = "\n".join(
            f"[{item['chunk_id']}] ({item['source']} | {item['machine_type']} | score={item['score']:.2f})\n{item['text']}"
            for item in context
        )

        messages: list[AIClientMessage] = [
            AIClientMessage(role="system", content=_SYSTEM_PROMPT),
        ]

        # Include up to the last 6 history messages for multi-turn context.
        for h in (req.history or [])[-6:]:
            messages.append(AIClientMessage(role=h.role, content=h.content))

        user_prompt = (
            f"Locale: {req.locale or 'en'}\n\n"
            f"Context chunks (use only these for factual claims):\n{context_block}\n\n"
            f"Question: {req.question}"
        )
        messages.append(AIClientMessage(role="user", content=user_prompt))

        return self.ai.client.generate(messages, temperature=0.15, max_tokens=1500).strip()
