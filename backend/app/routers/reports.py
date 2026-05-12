from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import UserContext
from app.database.session import get_db
from app.schemas.reports import (
    CommitReportRequest,
    CommitReportResponse,
    ModifyReformulationRequest,
    ReformulatedReport,
    ReportDraft,
)
from app.services.report_service import ReportService

router = APIRouter()


@router.post("/reformulate", response_model=ReformulatedReport)
def reformulate(payload: ReportDraft, user: UserContext = Depends(get_current_user), db: Session = Depends(get_db)):
    return ReportService(db=db).reformulate(user=user, draft=payload)


@router.post("/modify", response_model=ReformulatedReport)
def modify(payload: ModifyReformulationRequest, user: UserContext = Depends(get_current_user), db: Session = Depends(get_db)):
    return ReportService(db=db).modify(user=user, req=payload)


@router.post("/commit", response_model=CommitReportResponse, status_code=201)
def commit(payload: CommitReportRequest, user: UserContext = Depends(get_current_user), db: Session = Depends(get_db)):
    report_id = ReportService(db=db).commit(user=user, req=payload)
    return CommitReportResponse(report_id=report_id)
