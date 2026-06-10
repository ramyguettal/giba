from __future__ import annotations

from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings

# Locate .env: check cwd first, then walk up to project root (max 3 levels).
def _find_env() -> str:
    here = Path.cwd()
    for directory in [here, here.parent, here.parent.parent, here.parent.parent.parent]:
        candidate = directory / ".env"
        if candidate.exists():
            return str(candidate)
    return ".env"


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_PORT: int = 8000

    SECRET_KEY: str = ""

    # Postgres settings
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "giba_maintainance_assistant"
    POSTGRES_USER: str = "giba_user"
    POSTGRES_PASSWORD: str = ""

    # Preferred connection string (used by docker-compose)
    DATABASE_URL: str = ""

    # Optional SSL mode for Postgres connections.
    DATABASE_SSLMODE: str = ""

    # Vector store (Postgres + pgvector)
    VECTOR_TABLE: str = "vector_documents"
    # Voyage AI `voyage-3.5` embeddings are 1024-dimensional.
    VECTOR_EMBEDDING_DIM: int = 1024

    # Embeddings (Voyage AI)
    VOYAGE_API_KEY: str = ""
    VOYAGE_MODEL: str = "voyage-3.5"
    VOYAGE_API_URL: str = "https://api.voyageai.com/v1/embeddings"
    # Request timeout (seconds) for the Voyage embeddings endpoint.
    VOYAGE_TIMEOUT: float = 30.0
    # Max inputs per Voyage request (the API accepts up to 1000).
    VOYAGE_BATCH_SIZE: int = 128

    # LLM provider (OpenRouter) — used for grounded answer generation, not embeddings.
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "deepseek/deepseek-v4-flash"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    # Legacy alias kept for backwards-compatibility; OPENROUTER_API_KEY takes precedence.
    OPENCODE_API_KEY: str = ""
    OPENCODE_MODEL: str = "deepseek/deepseek-v4-flash"

    @property
    def llm_api_key(self) -> str:
        return self.OPENROUTER_API_KEY or self.OPENCODE_API_KEY

    @property
    def llm_model(self) -> str:
        return self.OPENROUTER_MODEL if self.OPENROUTER_API_KEY else self.OPENCODE_MODEL

    @property
    def llm_base_url(self) -> str:
        return self.OPENROUTER_BASE_URL if self.OPENROUTER_API_KEY else "https://opencode.ai/zen/go/v1"

    # Auth
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480
    JWT_REFRESH_EXPIRE_MINUTES: int = 60 * 24 * 14

    # Frontend / CORS
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    CORS_ALLOW_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # Optional bootstrap admin (dev convenience)
    BOOTSTRAP_ADMIN_USERNAME: str = ""
    BOOTSTRAP_ADMIN_PASSWORD: str = ""
    BOOTSTRAP_ADMIN_ALLOWED_MACHINES: str = ""

    class Config:
        env_file = _find_env()

    def _with_sslmode(self, url: str) -> str:
        sslmode = (self.DATABASE_SSLMODE or "").strip()
        if not sslmode:
            return url

        parts = urlsplit(url)
        query = dict(parse_qsl(parts.query, keep_blank_values=True))
        if "sslmode" in query:
            return url

        query["sslmode"] = sslmode
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self._with_sslmode(self.DATABASE_URL)
        password = self.POSTGRES_PASSWORD
        url = (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{password}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

        return self._with_sslmode(url)


settings = Settings()
