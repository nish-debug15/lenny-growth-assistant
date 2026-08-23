"""create_hnsw_index

Revision ID: 6a8b1b810000
Revises: ac2ae5b859b2
Create Date: 2026-08-23 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a8b1b810000'
down_revision: Union[str, None] = 'ac2ae5b859b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create HNSW index on transcript_chunks.embedding using cosine distance
    # m=16, ef_construction=64 are reasonable defaults for pgvector HNSW
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_transcript_chunks_embedding_hnsw 
        ON transcript_chunks 
        USING hnsw (embedding vector_cosine_ops) 
        WITH (m = 16, ef_construction = 64);
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_transcript_chunks_embedding_hnsw;")
