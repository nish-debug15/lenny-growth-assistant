"""Async SQLAlchemy engine and session factory."""

import sys
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from sqlalchemy.pool import NullPool, QueuePool

from app.config import settings

# Use NullPool during tests to avoid cross-loop connection issues with pytest-asyncio
is_testing = "pytest" in sys.modules

engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if is_testing:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_async_engine(
    settings.database_url,
    **engine_kwargs
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """FastAPI dependency: yields an async DB session."""
    async with async_session_factory() as session:
        yield session


async def check_db_connection() -> bool:
    """Check if the database is reachable. Returns True/False, never raises."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
