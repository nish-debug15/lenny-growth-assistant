import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Load the model once when this module is imported.
# all-MiniLM-L6-v2 produces 384-dimensional vectors.
MODEL_NAME = "all-MiniLM-L6-v2"
logger.info(f"Loading embedding model {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)
logger.info(f"Successfully loaded embedding model.")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of strings."""
    if not texts:
        return []
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Generate an embedding for a single query string."""
    return embed_texts([query])[0]
