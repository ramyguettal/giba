from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenError
from app.core.security import UserContext
from app.database.session import get_db
from app.repositories.audit_repository import AuditRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.repositories.report_repository import ReportRepository

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise ForbiddenError("Admin access required")

    report_repo = ReportRepository(db)
    audit_repo = AuditRepository(db)
    ingestion_repo = IngestionRepository(db)

    total_reports = report_repo.count_all()
    total_queries = audit_repo.count_all()
    low_confidence = audit_repo.count_low_confidence()
    active_jobs = ingestion_repo.count_active()
    reports_by_machine = report_repo.count_by_machine()

    recent_reports = report_repo.get_recent(5)
    recent_queries = audit_repo.get_recent(10)
    recent_jobs = ingestion_repo.get_recent(10)

    recent_activity = [
        *[{"action": f"Report created for {r.machine_type}", "timestamp": r.created_at.isoformat()} for r in recent_reports],
        *[{"action": f"Query: {q.query[:80]}", "timestamp": q.created_at.isoformat()} for q in recent_queries],
    ]
    recent_activity.sort(key=lambda a: a["timestamp"], reverse=True)
    recent_activity = recent_activity[:20]

    return {
        "stats": {
            "totalReports": total_reports,
            "totalQueries": total_queries,
            "lowConfidenceQueries": low_confidence,
            "activeJobs": active_jobs,
            "reportsByMachine": reports_by_machine,
            "recentActivity": recent_activity,
        },
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "detail": j.detail,
                "machineType": j.machine_type,
                "jobType": j.job_type,
                "type": j.job_type,
                "status": j.status,
                "error": j.error,
                "createdAt": j.created_at.isoformat(),
            }
            for j in recent_jobs
        ],
        "recentQueries": [
            {
                "id": q.id,
                "question": q.query,
                "createdAt": q.created_at.isoformat(),
                "confidenceLevel": "high" if q.confidence >= 0.7 else "medium" if q.confidence >= 0.4 else "low",
            }
            for q in recent_queries
        ],
        "recentReports": [
            {
                "id": r.id,
                "machine_type": r.machine_type,
                "createdAt": r.created_at.isoformat(),
            }
            for r in recent_reports
        ],
    }
