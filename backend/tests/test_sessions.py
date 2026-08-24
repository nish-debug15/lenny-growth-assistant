import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_session(client: AsyncClient):
    response = await client.post("/sessions", json={"user_metadata": {"theme": "dark"}})
    assert response.status_code == 201
    
    data = response.json()
    assert "id" in data
    assert data["user_metadata"] == {"theme": "dark"}

@pytest.mark.asyncio
async def test_list_sessions(client: AsyncClient):
    # Create a couple of sessions first
    await client.post("/sessions", json={"user_metadata": {"session": "1"}})
    await client.post("/sessions", json={"user_metadata": {"session": "2"}})
    
    response = await client.get("/sessions")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    assert "id" in data[0]

@pytest.mark.asyncio
async def test_get_session(client: AsyncClient):
    # Create a session
    create_response = await client.post("/sessions", json={"user_metadata": {"test": "get_session"}})
    session_id = create_response.json()["id"]
    
    # Get the session by ID
    response = await client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == session_id
    assert data["user_metadata"] == {"test": "get_session"}

@pytest.mark.asyncio
async def test_get_session_messages(client: AsyncClient):
    # Create a session
    create_response = await client.post("/sessions", json={"user_metadata": {"test": "messages"}})
    session_id = create_response.json()["id"]
    
    # Get messages
    response = await client.get(f"/sessions/{session_id}/messages")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0  # Should be empty initially

@pytest.mark.asyncio
async def test_get_nonexistent_session(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/sessions/{fake_id}")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_nonexistent_session_messages(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/sessions/{fake_id}/messages")
    assert response.status_code == 404
