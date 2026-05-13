from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenError, ValidationError
from app.core.security import UserContext
from app.database.session import get_db
from app.schemas.ingestion import IngestionJobResponse, ManufacturerAlertRequest
from app.services.ingestion_service import IngestionService

router = APIRouter()


def _require_admin(user: UserContext) -> None:
    if user.role != "admin":
        raise ForbiddenError("Admin access required")


@router.post("/manufacturer-alert", response_model=IngestionJobResponse, status_code=202)
def manufacturer_alert(
    payload: ManufacturerAlertRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    if not idempotency_key:
        raise ValidationError("Idempotency-Key header is required")

    service = IngestionService(db=db)
    job = service.enqueue_manufacturer_alert(user=user, payload=payload, idempotency_key=idempotency_key)
    return IngestionJobResponse(
        job_id=job.id,
        status=job.status,
        job_type=job.job_type,
        machine_type=job.machine_type,
        title=job.title,
        detail=job.detail,
        error=job.error,
    )


@router.post("/manual", response_model=IngestionJobResponse, status_code=202)
def manual_ingestion(
    title: str = Form(...),
    machine_type: str = Form(...),
    detail: str = Form(""),
    file: UploadFile | None = File(default=None),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    if not idempotency_key:
        raise ValidationError("Idempotency-Key header is required")

    service = IngestionService(db=db)
    job = service.enqueue_manual(
        user=user,
        title=title,
        machine_type=machine_type,
        detail=detail,
        file=file,
        idempotency_key=idempotency_key,
    )
    return IngestionJobResponse(
        job_id=job.id,
        status=job.status,
        job_type=job.job_type,
        machine_type=job.machine_type,
        title=job.title,
        detail=job.detail,
        error=job.error,
    )


@router.get("/jobs/{job_id}", response_model=IngestionJobResponse)
def job_status(
    job_id: str,
    user: UserContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(user)
    job = IngestionService(db=db).get_job(job_id)
    return IngestionJobResponse(
        job_id=job.id,
        status=job.status,
        job_type=job.job_type,
        machine_type=job.machine_type,
        title=job.title,
        detail=job.detail,
        error=job.error,
    )
