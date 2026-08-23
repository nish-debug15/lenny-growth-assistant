import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Session


async def create_session(db: AsyncSession, user_metadata: dict | None = None) -> Session:
    """Create a new chat session."""
    session = Session(user_metadata=user_metadata or {})
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: uuid.UUID) -> Session | None:
    """Get a session by ID."""
    stmt = select(Session).where(Session.id == session_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_sessions(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[Session]:
    """List sessions, ordered by most recently created."""
    stmt = select(Session).order_by(Session.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return list(result.scalars().all())
