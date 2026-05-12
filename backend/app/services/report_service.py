from __future__ import annotations

from sqlalchemy.orm import Session

from app.clients.vector_store_client import VectorStoreClient
from app.core.exceptions import ForbiddenError
from app.core.security import UserContext
from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.schemas.reports import (
    CommitReportRequest,
    ModifyReformulationRequest,
    ReformulatedReport,
    ReportDraft,
)
from app.services.embedding_service import EmbeddingService
from app.services.genrative_ai_services import GenrativeAIServices


class ReportService:
    def __init__(
        self,
        *,
        db: Session,
        ai: GenrativeAIServices | None = None,
        embeddings: EmbeddingService | None = None,
        vector_store: VectorStoreClient | None = None,
    ):
        self.db = db
        self.repo = ReportRepository(db)
        self.ai = ai or GenrativeAIServices()
        self.embeddings = embeddings or EmbeddingService()
        self.vector_store = vector_store or VectorStoreClient(db=db)

    @staticmethod
    def _validate_machine_access(user: UserContext, machine_type: str) -> None:
        if machine_type not in (user.allowed_machines or []):
            raise ForbiddenError("You are not authorized for this machine scope")

    def reformulate(self, *, user: UserContext, draft: ReportDraft) -> ReformulatedReport:
        self._validate_machine_access(user, draft.machine_type)
        clean = self.ai.reformulate_report(
            problem=draft.problem,
            cause=draft.cause,
            solution=draft.solution,
            locale=draft.locale,
        )
        return ReformulatedReport(**clean)

    def modify(self, *, user: UserContext, req: ModifyReformulationRequest) -> ReformulatedReport:
        clean = self.ai.modify_reformulation(
            clean_problem=req.clean_problem,
            clean_cause=req.clean_cause,
            clean_solution=req.clean_solution,
            instruction=req.instruction,
            locale=req.locale,
        )
        return ReformulatedReport(**clean)

    def commit(self, *, user: UserContext, req: CommitReportRequest) -> str:
        self._validate_machine_access(user, req.machine_type)

        combined = f"Problem: {req.clean_problem}\nCause: {req.clean_cause}\nSolution: {req.clean_solution}".strip()
        report = Report(
            user_id=user.id,
            machine_type=req.machine_type,
            problem=req.problem,
            cause=req.cause,
            solution=req.solution,
            clean_problem=req.clean_problem,
            clean_cause=req.clean_cause,
            clean_solution=req.clean_solution,
            combined_clean_text=combined,
            source="repairer",
            metadata_={},
        )
        report = self.repo.create(report)

        embedding = self.embeddings.embed_text(combined)
        self.vector_store.upsert_documents(
            ids=[report.id],
            documents=[combined],
            embeddings=[embedding],
            metadatas=[
                {
                    "source": "repairer",
                    "machine_type": req.machine_type,
                    "report_id": report.id,
                    "user_id": user.id,
                }
            ],
        )

        return report.id
