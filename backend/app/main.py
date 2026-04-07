from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import structlog
from app.core.config import settings

# Structured logging configuration
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

app = FastAPI(title="GIBA HR Assistant API", version="1.0.0")

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else [settings.NEXT_PUBLIC_API_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Middleware
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
        ip=request.client.host if request.client else "unknown"
    )
    return response

# Global Exception Handler (Basic Stub)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return {"error": "Internal Server Error", "detail": str(exc)}

# Health Check Route
@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Placeholders for upcoming routers
# app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(chat.router, prefix="/chat", tags=["chat"])
# app.include_router(admin.router, prefix="/admin", tags=["admin"])
