from __future__ import annotations

import time

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.database.session import SessionLocal
from app.middleware.correlation_id import CorrelationIdMiddleware
from app.middleware.error_handler import register_exception_handlers
from app.routers import auth, chat, dashboard, health, ingestion, reports
from app.services.auth_service import AuthService


def configure_logging() -> structlog.stdlib.BoundLogger:
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ]
    )
    return structlog.get_logger()


logger = configure_logging()

app = FastAPI(title="GIBA Maintenance Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"]
    if settings.APP_ENV == "development"
    else (settings.CORS_ALLOW_ORIGINS or [settings.NEXT_PUBLIC_API_URL]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CorrelationIdMiddleware)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start_time) * 1000)

    logger.info(
        "request_handled",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=duration_ms,
        ip=request.client.host if request.client else "unknown",
        correlation_id=getattr(request.state, "correlation_id", None),
        user_id=getattr(request.state, "user_id", None),
    )
    return response


register_exception_handlers(app)

# Routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
app.include_router(dashboard.router, tags=["dashboard"])

# Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")


@app.on_event("startup")
def _startup() -> None:
    db = SessionLocal()
    try:
        try:
            AuthService(db=db).ensure_bootstrap_admin()
        except Exception as exc:
            logger.warning("bootstrap_admin_failed", error=str(exc))
    finally:
        db.close()
