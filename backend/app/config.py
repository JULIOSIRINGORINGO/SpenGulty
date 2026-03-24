from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Database - SQLite for local dev
    DATABASE_URL: str = "sqlite+aiosqlite:///./spendguilty.db"

    # JWT
    JWT_SECRET: str = "spendguilty_jwt_secret_key_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # Uploads
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
