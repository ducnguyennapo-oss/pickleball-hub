import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_invalid_phone():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/v1/auth/register", json={"phone": "invalid", "full_name": "Test"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_team_split():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # This will fail auth — just test routing
        resp = await client.post(
            "/api/v1/team/split",
            json={"players": ["A", "B", "C", "D"], "num_teams": 2},
        )
    assert resp.status_code in (401, 200)
