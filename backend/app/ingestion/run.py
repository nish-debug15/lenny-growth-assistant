import asyncio
import hashlib
import logging
from pathlib import Path

from app.db.connection import async_session_factory
from app.db.repositories.chunks import upsert_chunk
from app.embeddings import embed_texts
from app.ingestion.chunker import chunk_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def compute_hash(text: str) -> str:
    """Compute SHA-256 hash of text for idempotency."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def ingest_file(file_path: Path):
    """Read, chunk, embed, and ingest a single markdown file."""
    logger.info(f"Ingesting {file_path.name}...")
    content = file_path.read_text(encoding="utf-8")
    chunks = chunk_text(content)
    
    if not chunks:
        logger.warning(f"No content found in {file_path.name}")
        return

    logger.info(f"Generated {len(chunks)} chunks for {file_path.name}. Computing embeddings...")
    embeddings = embed_texts(chunks)

    # Use filename as source_episode (e.g. "episode_1.md" -> "episode_1")
    source_episode = file_path.stem

    async with async_session_factory() as db:
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            content_hash = compute_hash(chunk)
            await upsert_chunk(
                db=db,
                source_episode=source_episode,
                chunk_text=chunk,
                embedding=emb,
                chunk_index=idx,
                source_url=None,  # Optional: could derive from metadata if present
                content_hash=content_hash,
            )
    
    logger.info(f"Successfully ingested {len(chunks)} chunks from {file_path.name}.")


async def run_ingestion(data_dir: str = "/app/data/transcripts"):
    """Run the ingestion pipeline for all markdown files in the data directory."""
    dir_path = Path(data_dir)
    if not dir_path.exists() or not dir_path.is_dir():
        logger.error(f"Data directory {data_dir} does not exist.")
        return

    md_files = list(dir_path.glob("*.md"))
    if not md_files:
        logger.info(f"No markdown files found in {data_dir}.")
        return

    logger.info(f"Found {len(md_files)} markdown files. Starting ingestion...")
    
    for file_path in md_files:
        await ingest_file(file_path)
        
    logger.info("Ingestion pipeline completed.")


if __name__ == "__main__":
    asyncio.run(run_ingestion())
