from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings


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
    # Supabase requires SSL (typically: "require").
    # If set, this value is injected into DATABASE_URL (unless already present).
    DATABASE_SSLMODE: str = ""

    # Redis settings (kept for backwards compatibility)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = ""

    # Vector store (Postgres + pgvector)
    # Stored in the same Postgres database as relational tables.
    VECTOR_TABLE: str = "vector_documents"
    VECTOR_EMBEDDING_DIM: int = 384

    # Embeddings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    # LLM provider (Groq)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"

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
        env_file = ".env"

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

    def get_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"


settings = Settings()
