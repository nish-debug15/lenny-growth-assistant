import pytest
from httpx import AsyncClient
from unittest.mock import patch

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    with patch("app.main.check_db_connection", return_value=True):
        response = await client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"
        assert "db" in data
        assert data["db"] is True
        assert "timestamp" in data
        assert "groq_configured" in data
        assert "anthropic_configured" in data
