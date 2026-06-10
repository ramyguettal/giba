from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenError
from app.core.security import UserContext
from app.database.session import get_db
from app.schemas.reports import (
    CommitReportRequest,
    CommitReportResponse,
    ModifyReformulationRequest,
    ReformulatedReport,
    ReportDraft,
    ReportListResponse,
)
from app.services.report_service import ReportService

router = APIRouter()


def _require_admin(user: UserContext) -> None:
    if user.role != "admin":
        raise ForbiddenError("Admin access required")


@router.post("/reformulate", response_model=ReformulatedReport)
def reformulate(
    payload: ReportDraft,
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReportService(db=db).reformulate(user=user, draft=payload)


@router.post("/modify", response_model=ReformulatedReport)
def modify(
    payload: ModifyReformulationRequest,
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReportService(db=db).modify(user=user, req=payload)


@router.post("/commit", response_model=CommitReportResponse, status_code=201)
def commit(
    payload: CommitReportRequest,
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_id = ReportService(db=db).commit(user=user, req=payload)
    return CommitReportResponse(report_id=report_id)


@router.get("", response_model=ReportListResponse)
def list_reports(
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    return ReportService(db=db).list_reports(limit=limit, offset=offset)


@router.post("/{report_id}/index", status_code=204)
def index_report(
    report_id: str,
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    ReportService(db=db).index_report(report_id=report_id, user=user)


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: str,
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    ReportService(db=db).delete_report(report_id=report_id, user=user)
