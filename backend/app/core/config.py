from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    SECRET_KEY: str
    APP_PORT: int = 8000
    
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "giba_hr"
    POSTGRES_USER: str = "giba_user"
    POSTGRES_PASSWORD: str

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    CHROMA_PERSIST_PATH: str = "./data/chroma"

    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama3-70b-8192"

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"

    class Config:
        env_file = ".env"

settings = Settings()
