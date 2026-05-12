from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.exceptions import DomainError


def _error_payload(*, request: Request, code: str, message: str, details: Any | None = None):
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "correlation_id": getattr(request.state, "correlation_id", None),
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError):
        return JSONResponse(
            status_code=exc.http_status,
            content=_error_payload(
                request=request, code=exc.code, message=exc.message, details=exc.details
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=_error_payload(
                request=request,
                code="internal_error",
                message="Internal Server Error",
                details=str(exc) if app.debug else None,
            ),
        )
