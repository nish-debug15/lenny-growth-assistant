import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    user_metadata: dict | None = None


class SessionResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    user_metadata: dict

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    role: str
    content: str
    provider_used: str | None = None


class MessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    provider_used: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
