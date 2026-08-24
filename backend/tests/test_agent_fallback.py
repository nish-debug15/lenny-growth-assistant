import pytest
from unittest.mock import patch, AsyncMock
from app.agent.provider import chat_with_agent
from app.db.repositories.sessions import create_session

@pytest.mark.asyncio
async def test_chat_fallback_groq_to_anthropic(db_session):
    # 1. Create a session
    session_obj = await create_session(db_session, "fallback-test")
    
    # 2. Mock Groq to fail, Anthropic to succeed
    with patch("app.agent.provider.settings.default_provider", "groq"), \
         patch("app.agent.provider.generate_response_groq", new_callable=AsyncMock) as mock_groq, \
         patch("app.agent.provider.generate_response_anthropic", new_callable=AsyncMock) as mock_anthropic:
             
        mock_groq.side_effect = Exception("Groq is down")
        mock_anthropic.return_value = "Anthropic saved the day!"
        
        response = await chat_with_agent(db_session, str(session_obj.id), "Help me!")
        
        assert response == "Anthropic saved the day!"
        mock_groq.assert_called_once()
        mock_anthropic.assert_called_once()

@pytest.mark.asyncio
async def test_chat_fallback_anthropic_to_groq(db_session):
    # 1. Create a session
    session_obj = await create_session(db_session, "fallback-test-2")
    
    # 2. Mock Anthropic to fail, Groq to succeed
    with patch("app.agent.provider.settings.default_provider", "anthropic"), \
         patch("app.agent.provider.generate_response_anthropic", new_callable=AsyncMock) as mock_anthropic, \
         patch("app.agent.provider.generate_response_groq", new_callable=AsyncMock) as mock_groq:
             
        mock_anthropic.side_effect = Exception("Anthropic is down")
        mock_groq.return_value = "Groq saved the day!"
        
        response = await chat_with_agent(db_session, str(session_obj.id), "Help me!")
        
        assert response == "Groq saved the day!"
        mock_anthropic.assert_called_once()
        mock_groq.assert_called_once()
