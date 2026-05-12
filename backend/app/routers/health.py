from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "giba-backend"}


@router.get("/ready")
def readiness_check():
    # Minimal readiness: if app boots, it's ready. DB/Redis deeper checks can be added later.
    return {"status": "ready"}
