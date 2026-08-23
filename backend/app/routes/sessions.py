import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_session as get_db_session
from app.db.repositories import sessions as sessions_repo
from app.db.repositories import messages as messages_repo
from app.schemas.chat import SessionCreate, SessionResponse, MessageResponse


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_in: SessionCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new chat session."""
    session = await sessions_repo.create_session(db, session_in.user_metadata)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a chat session by ID."""
    session = await sessions_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/messages", response_model=list[MessageResponse])
async def get_session_messages(
    session_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session)
):
    """Get all messages for a specific session."""
    # Ensure session exists
    session = await sessions_repo.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = await messages_repo.get_messages_by_session(db, session_id, limit, offset)
    return messages
