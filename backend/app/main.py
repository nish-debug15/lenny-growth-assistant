"""FastAPI application — The Lenny Growth Assistant."""

import traceback
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import settings
from app.logging_config import setup_logging
from app.middleware import RequestLoggingMiddleware
from app.db.connection import check_db_connection
from app.routes.sessions import router as sessions_router
from app.routes.chat import router as chat_router

setup_logging()
logger = structlog.get_logger(__name__)

app = FastAPI(
    title="Lenny Growth Assistant",
    description="RAG-powered conversational assistant over Lenny's Podcast transcripts",
    version="0.1.0",
)

app.add_middleware(RequestLoggingMiddleware)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(chat_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled_exception",
        error=str(exc),
        traceback=traceback.format_exc(),
        method=request.method,
        path=request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

@app.get("/health")
async def health_check():
    """Health endpoint: confirms the API is up and the DB is reachable."""
    db_ok = await check_db_connection()
    groq_configured = bool(settings.groq_api_key)
    anthropic_configured = bool(settings.anthropic_api_key)
    
    return {
        "status": "ok" if db_ok else "degraded",
        "db": db_ok,
        "groq_configured": groq_configured,
        "anthropic_configured": anthropic_configured,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
