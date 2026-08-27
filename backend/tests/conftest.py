# Pytest config
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.connection import async_session_factory

pytest_plugins = ("pytest_asyncio",)

import sys
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    from app.config import settings
    from sqlalchemy.pool import NullPool
    
    # Create a fresh engine for each test's event loop
    test_engine = create_async_engine(
        settings.get_database_url,
        poolclass=NullPool,
        echo=False
    )
    test_session_factory = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with test_session_factory() as session:
        yield session
        
    await test_engine.dispose()

from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def client() -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as c:
        yield c

