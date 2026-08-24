import pytest
from unittest.mock import patch, AsyncMock
from app.agent.ship30 import generate_ship30_essay
from app.db.models import TranscriptChunk

@pytest.mark.asyncio
async def test_ship30_essay_no_context(db_session):
    # Query a topic with no context in DB
    essay = await generate_ship30_essay(db_session, "quantum computing")
    assert "No relevant podcast transcripts found" in essay

@pytest.mark.asyncio
async def test_ship30_essay_with_context(db_session):
    # Mock search to return something, and mock the LLM client
    mock_chunks = [
        TranscriptChunk(
            source_episode="test_episode",
            chunk_text="Growth is about activation.",
            embedding=[0.0] * 384,
            chunk_index=0
        )
    ]
    
    with patch("app.agent.ship30.search_similar_chunks", new_callable=AsyncMock) as mock_search, \
         patch("app.agent.ship30.settings.default_provider", "groq"), \
         patch("app.agent.ship30.AsyncOpenAI") as mock_openai:
             
        mock_search.return_value = mock_chunks
        
        # Mock the deep response object
        mock_response = AsyncMock()
        mock_response.choices = [
            AsyncMock(message=AsyncMock(content="Here is a great Ship 30 essay about growth!"))
        ]
        
        # Configure the client mock
        mock_client_instance = mock_openai.return_value
        mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        
        essay = await generate_ship30_essay(db_session, "growth activation")
        
        assert "artifact type=\"ship30_essay\"" in essay
        assert "Here is a great Ship 30 essay" in essay
        
        mock_search.assert_called_once()
        mock_client_instance.chat.completions.create.assert_called_once()
