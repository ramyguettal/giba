from __future__ import annotations

import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    header_name = "X-Correlation-Id"

    async def dispatch(self, request: Request, call_next: Callable):
        correlation_id = request.headers.get(self.header_name) or str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        response: Response = await call_next(request)
        response.headers[self.header_name] = correlation_id
        return response
