import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import TranscriptChunk
from app.embeddings import embed_query

logger = logging.getLogger(__name__)


async def search_similar_chunks(
    db: AsyncSession, 
    query: str, 
    top_k: int = settings.retrieval_top_k, 
    similarity_threshold: float = settings.similarity_threshold
) -> list[TranscriptChunk]:
    """
    Search for transcript chunks relevant to the query.
    
    pgvector <=> operator calculates cosine distance (0 = exact match, 2 = opposite).
    similarity_threshold refers to the minimum cosine similarity (1.0 = exact match, -1.0 = opposite).
    Therefore, distance = 1.0 - similarity. 
    A similarity_threshold of 0.35 means we want distance <= 0.65.
    """
    query_embedding = embed_query(query)
    max_distance = 1.0 - similarity_threshold

    # Calculate distance using pgvector's vector_cosine_ops (<=>)
    distance_expr = TranscriptChunk.embedding.cosine_distance(query_embedding)
    
    stmt = (
        select(TranscriptChunk)
        .where(distance_expr <= max_distance)
        .order_by(distance_expr)
        .limit(top_k)
    )
    
    result = await db.execute(stmt)
    chunks = list(result.scalars().all())
    
    logger.info(f"Retrieval query '{query}' yielded {len(chunks)} results.")
    return chunks
