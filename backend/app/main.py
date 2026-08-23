"""FastAPI application — The Lenny Growth Assistant."""

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.connection import check_db_connection

app = FastAPI(
    title="Lenny Growth Assistant",
    description="RAG-powered conversational assistant over Lenny's Podcast transcripts",
    version="0.1.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health endpoint: confirms the API is up and the DB is reachable."""
    db_ok = await check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "db": db_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
