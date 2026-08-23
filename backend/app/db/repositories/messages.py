import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Message


async def create_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    role: str,
    content: str,
    provider_used: str | None = None
) -> Message:
    """Create a new message in a session."""
    msg = Message(
        session_id=session_id,
        role=role,
        content=content,
        provider_used=provider_used
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def get_messages_by_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0
) -> list[Message]:
    """Get all messages for a session, ordered by creation time."""
    stmt = (
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
