from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TranscriptChunk


async def upsert_chunk(
    db: AsyncSession,
    source_episode: str,
    chunk_text: str,
    embedding: list[float],
    chunk_index: int,
    source_url: str | None,
    content_hash: str
) -> TranscriptChunk:
    """Insert a new chunk, or do nothing if content_hash already exists."""
    stmt = insert(TranscriptChunk).values(
        source_episode=source_episode,
        chunk_text=chunk_text,
        embedding=embedding,
        chunk_index=chunk_index,
        source_url=source_url,
        content_hash=content_hash,
    )
    # Idempotent: if content_hash matches, do nothing.
    stmt = stmt.on_conflict_do_nothing(index_elements=["content_hash"])
    
    result = await db.execute(stmt.returning(TranscriptChunk))
    # It might return None if conflict occurred and do_nothing was triggered.
    # In a real app we might fetch the existing row, but for ingestion doing nothing is fine.
    row = result.scalar_one_or_none()
    await db.commit()
    return row

# search_similar will be added during Block 3 (Retrieval).
