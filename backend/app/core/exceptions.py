from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class DomainError(Exception):
    code: str
    message: str
    http_status: int = 400
    details: Any | None = None


class UnauthorizedError(DomainError):
    def __init__(self, message: str = "Not authenticated", details: Any | None = None):
        super().__init__(
            code="unauthorized",
            message=message,
            http_status=401,
            details=details,
        )


class ForbiddenError(DomainError):
    def __init__(self, message: str = "Forbidden", details: Any | None = None):
        super().__init__(
            code="forbidden",
            message=message,
            http_status=403,
            details=details,
        )


class NotFoundError(DomainError):
    def __init__(self, message: str = "Not found", details: Any | None = None):
        super().__init__(
            code="not_found",
            message=message,
            http_status=404,
            details=details,
        )


class ConflictError(DomainError):
    def __init__(self, message: str = "Conflict", details: Any | None = None):
        super().__init__(
            code="conflict",
            message=message,
            http_status=409,
            details=details,
        )


class ValidationError(DomainError):
    def __init__(self, message: str = "Validation error", details: Any | None = None):
        super().__init__(
            code="validation_error",
            message=message,
            http_status=422,
            details=details,
        )
