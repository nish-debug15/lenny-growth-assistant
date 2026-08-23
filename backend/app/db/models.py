"""SQLAlchemy ORM models for the Lenny Growth Assistant."""

import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("now()"))
    user_metadata = Column(JSONB, default=dict, server_default=text("'{}'::jsonb"))

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    provider_used = Column(String(50), nullable=True)  # 'anthropic' | 'groq' | null for user msgs
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("now()"))

    session = relationship("Session", back_populates="messages")


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    source_episode = Column(Text, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384))  # all-MiniLM-L6-v2 produces 384-dim vectors
    chunk_index = Column(Integer, nullable=False)
    source_url = Column(Text, nullable=True)
    content_hash = Column(String(64), unique=True, nullable=True)  # sha256 for idempotent upserts
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("now()"))
