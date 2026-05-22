from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://scheduler:scheduler123@localhost:5432/scheduler_db"
    DATABASE_SYNC_URL: str = "postgresql://scheduler:scheduler123@localhost:5432/scheduler_db"

    SECRET_KEY: str = "supersecretkey-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    SCRIPTS_DIR: str = "./scripts"
    MAX_CONCURRENT_EXECUTIONS: int = 5

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
