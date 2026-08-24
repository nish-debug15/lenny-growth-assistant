import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        
        # We could bind structlog contextvars here if configured, 
        # but for simple usage we'll just log it in the dict.
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(process_time * 1000, 2),
                request_id=request_id,
            )
            
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                "request_failed",
                method=request.method,
                path=request.url.path,
                duration_ms=round(process_time * 1000, 2),
                request_id=request_id,
                error=str(e),
            )
            raise
