from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from app.config import get_settings


def _create_engine() -> AsyncEngine:
    settings = get_settings()
    # SQLite needs connect_args for check_same_thread
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        connect_args=connect_args,
    )


engine = _create_engine()

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)
