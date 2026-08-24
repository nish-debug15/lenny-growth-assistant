# Architecture

## System Overview

```text
+------+       +----------------+       +------------------+
| User | <---> | React Frontend | <---> | FastAPI Backend  |
+------+       +----------------+       +---------+--------+
                                                  |
                                                  v
                                        +-------------------+
                                        |  Agent / RAG Core |
                                        +-------------------+
                                        |                   |
                                        v                   v
                            +-------------+    +---------------+
                            | LLM (Groq)  |    | PostgreSQL    |
                            +-------------+    | (pgvector)    |
                            |             |    +---------------+
                            | Sentence-   |
                            | Transformers|
                            +-------------+
```

## Layers

- **Frontend (React + Vite)**: Provides a chat interface and a dedicated Artifact Viewer. Uses Vite for fast builds and HMR.
- **API (FastAPI)**: Serves REST endpoints for chat sessions and messaging. Handles input validation and orchestrates the agent loop.
- **Agent (`provider.py`)**: Implements a tool-calling loop. Decides when to fetch context, search for artifacts, or query the LLM.
- **Retrieval**: Uses `sentence-transformers` to generate embeddings and performs cosine similarity search in the database.
- **Database (PostgreSQL + pgvector)**: Stores session metadata, messages, and vector embeddings of Lenny's Podcast transcripts.
- **Ingestion Pipeline**: Parses markdown transcripts, chunks them, generates embeddings, and bulk-inserts them into the vector database.

## Data Flow

1. User sends a message via the Frontend.
2. Backend saves the message to the database.
3. RAG pipeline retrieves relevant context (if needed) using cosine similarity against `pgvector`.
4. Agent loop calls the Groq LLM with tools and context.
5. Response is sanitized (using Bleach) to prevent XSS.
6. The final response is saved to the DB and returned to the user.

## Key Design Decisions

- **Why `pgvector`?** It allows us to keep both relational data (sessions, messages) and vector data (transcripts) in a single database, simplifying operations and deployment.
- **Why Groq as primary?** It serves as a fast, free-tier alternative to running a local LLM, keeping the deployment lightweight while simulating rapid inference.
- **Why `bleach` for sanitization?** When returning artifacts (like HTML or markdown), it's crucial to strip out potentially malicious scripts before rendering on the frontend.
