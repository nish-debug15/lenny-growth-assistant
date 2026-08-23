import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

@pytest.mark.asyncio
async def test_create_and_retrieve_session(async_client: AsyncClient):
    # Create session
    create_resp = await async_client.post("/sessions", json={"user_metadata": {"foo": "bar"}})
    assert create_resp.status_code == 201
    
    session_data = create_resp.json()
    assert "id" in session_data
    assert session_data["user_metadata"] == {"foo": "bar"}
    session_id = session_data["id"]

    # Retrieve session messages (should be empty initially)
    msg_resp = await async_client.get(f"/sessions/{session_id}/messages")
    assert msg_resp.status_code == 200
    assert msg_resp.json() == []

@pytest.mark.asyncio
async def test_retrieve_nonexistent_session_messages(async_client: AsyncClient):
    fake_id = str(uuid.uuid4())
    msg_resp = await async_client.get(f"/sessions/{fake_id}/messages")
    assert msg_resp.status_code == 404

@pytest.mark.asyncio
async def test_malformed_request_returns_4xx(async_client: AsyncClient):
    # Malformed UUID
    msg_resp = await async_client.get("/sessions/invalid-uuid/messages")
    assert msg_resp.status_code == 422  # Unprocessable Entity (Pydantic validation error)
