import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_chat_requires_valid_session(client: AsyncClient):
    # Try chatting in a nonexistent session
    response = await client.post(
        "/chat",
        json={"session_id": "00000000-0000-0000-0000-000000000000", "message": "Hello"}
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_chat_rejects_empty_message(client: AsyncClient):
    # Try chatting with empty message
    response = await client.post(
        "/chat",
        json={"session_id": "00000000-0000-0000-0000-000000000000", "message": "   "}
    )
    assert response.status_code == 400
