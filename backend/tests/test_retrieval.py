import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.retrieval.search import search_similar_chunks

# We ingested 'sample_episode.md' in Block 2 which talks about:
# "growth strategies", "user activation", "retention", "leaky bucket".

@pytest.mark.asyncio
async def test_search_similar_chunks_in_domain(db_session: AsyncSession):
    # Query something clearly related to the dummy transcript
    query = "What is the Aha moment for user activation?"
    chunks = await search_similar_chunks(db_session, query)
    
    assert len(chunks) > 0, "Expected at least 1 relevant chunk for an in-domain query."
    # The chunk text should be our sample transcript text
    assert "activation" in chunks[0].chunk_text.lower()


@pytest.mark.asyncio
async def test_search_similar_chunks_out_of_domain(db_session: AsyncSession):
    # Query something completely unrelated to ensure distance gating works
    query = "What is the capital of France?"
    # Using default similarity_threshold (0.35)
    chunks = await search_similar_chunks(db_session, query)
    
    # We expect 0 chunks returned because the distance should be > 0.65
    assert len(chunks) == 0, f"Expected 0 chunks for out-of-domain query, but got {len(chunks)}"

@pytest.mark.asyncio
async def test_search_similar_chunks_garbage_string(db_session: AsyncSession):
    # Query pure garbage
    query = "asdfsdfjasldfkjweiowruqwe"
    chunks = await search_similar_chunks(db_session, query)
    assert len(chunks) == 0, "Expected 0 chunks for garbage string"
