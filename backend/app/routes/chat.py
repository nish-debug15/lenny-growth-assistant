import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.connection import get_session
from app.db.repositories.sessions import get_session as get_db_session
from app.agent.provider import chat_with_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

import uuid

class ChatRequest(BaseModel):
    session_id: uuid.UUID
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_session)
):
    """
    Send a message to the agent within a specific session.
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )
        
    # Verify session exists
    session_obj = await get_db_session(db, request.session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {request.session_id} not found."
        )
        
    response_text = await chat_with_agent(db, request.session_id, request.message)
    return ChatResponse(response=response_text)
