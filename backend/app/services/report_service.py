from __future__ import annotations

from sqlalchemy.orm import Session

from app.clients.vector_store_client import VectorStoreClient
from app.core.exceptions import ForbiddenError
from app.core.security import UserContext
from app.models.report import Report
from app.repositories.report_repository import ReportRepository
from app.repositories.user_repository import UserRepository
from app.schemas.reports import (
    CommitReportRequest,
    ModifyReformulationRequest,
    ReformulatedReport,
    ReportDraft,
    ReportListItem,
    ReportListResponse,
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
        if not self.ai.enabled:
            # No generative LLM configured: pass the fields through unchanged.
            return ReformulatedReport(
                clean_problem=draft.problem,
                clean_cause=draft.cause,
                clean_solution=draft.solution,
            )
        clean = self.ai.reformulate_report(
            problem=draft.problem.strip() or "(not provided)",
            cause=draft.cause.strip() or "(not provided)",
            solution=draft.solution.strip() or "(not provided)",
            locale=draft.locale,
        )
        # Never let the model invent content for fields the user left empty.
        if not draft.problem.strip():
            clean["clean_problem"] = draft.problem
        if not draft.cause.strip():
            clean["clean_cause"] = draft.cause
        if not draft.solution.strip():
            clean["clean_solution"] = draft.solution
        return ReformulatedReport(**clean)

    def modify(self, *, user: UserContext, req: ModifyReformulationRequest) -> ReformulatedReport:
        if not self.ai.enabled:
            # No generative LLM configured: return the current fields unchanged.
            return ReformulatedReport(
                clean_problem=req.clean_problem,
                clean_cause=req.clean_cause,
                clean_solution=req.clean_solution,
            )
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

        # Index into the vector store so future queries can find this report.
        # If embedding fails (e.g. transient rate limit), the report is still
        # committed — the DB record is the source of truth.
        try:
            embedding = self.embeddings.embed_text(combined, input_type="document")
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
                        "doc_type": "report",
                    }
                ],
            )
        except Exception:
            pass  # Vector indexing is best-effort; report is already saved.

        return report.id

    def list_reports(self, *, limit: int = 100, offset: int = 0) -> ReportListResponse:
        from sqlalchemy import text
        reports = self.repo.get_all(limit=limit, offset=offset)
        total = self.repo.count_all()

        # Check which report IDs are indexed in the vector store.
        # Chunks are stored as "{report_id}:{chunk_index}", so we look for any
        # vector_document whose id starts with the report id.
        indexed_ids: set[str] = set()
        if reports:
            from app.models.vector_document import VectorDocument
            ids = [r.id for r in reports]
            rows = self.db.query(VectorDocument.id).filter(
                VectorDocument.id.in_([f"{rid}:0" for rid in ids])
            ).all()
            indexed_ids = {row[0].split(":")[0] for row in rows}
            # Also check direct upserts (report.id used directly)
            rows2 = self.db.query(VectorDocument.id).filter(
                VectorDocument.id.in_(ids)
            ).all()
            indexed_ids |= {row[0] for row in rows2}

        user_repo = UserRepository(self.db)
        user_cache: dict[str, str] = {}

        items = []
        for r in reports:
            if r.user_id not in user_cache:
                u = user_repo.get_by_id(r.user_id)
                user_cache[r.user_id] = u.username if u else r.user_id[:8]
            items.append(ReportListItem(
                id=r.id,
                user_id=r.user_id,
                username=user_cache[r.user_id],
                machine_type=r.machine_type,
                problem=r.problem,
                cause=r.cause,
                solution=r.solution,
                clean_problem=r.clean_problem,
                clean_cause=r.clean_cause,
                clean_solution=r.clean_solution,
                source=r.source,
                is_indexed=r.id in indexed_ids,
                created_at=r.created_at.isoformat() if r.created_at else "",
            ))
        return ReportListResponse(reports=items, total=total)

    def delete_report(self, *, report_id: str, user: UserContext) -> None:
        report = self.repo.get(report_id)
        if not report:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Report not found")
        # Remove vectors first so a failure never leaves orphaned chunks that
        # would still be retrievable after the report record is gone.
        self.vector_store.delete_documents(ids=[report.id])
        self.repo.delete(report)

    def index_report(self, *, report_id: str, user: UserContext) -> None:
        report = self.repo.get(report_id)
        if not report:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Report not found")
        combined = report.combined_clean_text or (
            f"Problem: {report.clean_problem}\n"
            f"Cause: {report.clean_cause}\n"
            f"Solution: {report.clean_solution}"
        ).strip()
        embedding = self.embeddings.embed_text(combined, input_type="document")
        self.vector_store.upsert_documents(
            ids=[report.id],
            documents=[combined],
            embeddings=[embedding],
            metadatas=[{
                "source": report.source,
                "machine_type": report.machine_type,
                "report_id": report.id,
                "user_id": report.user_id,
                "doc_type": "report",
            }],
        )
