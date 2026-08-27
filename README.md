# The Lenny Growth Assistant

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue.svg)

A grounded, RAG-powered conversational assistant over Lenny's Podcast transcripts — with source citations, a Ship 30/30 essay-writing skill, and an in-app Artifact Viewer for generated Markdown/HTML.

> Built as a Forward Deployed Engineer Intern take-home assignment. See `PRD.md` for product rationale, `architecture.md` for system design, and `design.md` for UI/UX decisions.

---

## ✨ Features

- 🎙️ **Grounded RAG**: Answers questions using embeddings of Lenny's Podcast transcripts for highly contextual responses.
- 📝 **Ship 30/30 Essay Skill**: Specialized tool to help draft and refine essays based on podcast insights.
- 🎨 **Artifact Viewer**: In-app rendering of generated Markdown and sandboxed HTML directly alongside the chat.
- ⚡ **Fast & Responsive UI**: Built with React, Vite, and a sleek dark glass theme.
- 🔍 **Vector Search**: Leverages PostgreSQL + pgvector and sentence-transformers for fast cosine similarity search.
- 🛡️ **Secure Rendering**: Uses bleach for backend output sanitization and iframe sandboxing on the frontend.

---

## 🏗️ Architecture Overview

```text
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  React UI   │◄────►│  FastAPI     │◄────►│  Postgres        │
│  (chat +    │      │  backend     │      │  + pgvector      │
│  artifact   │      │  (agent      │      │  (sessions,      │
│  viewer)    │      │  routing)    │      │  embeddings)     │
└─────────────┘      └──────┬───────┘      └─────────────────┘
                            │
                   ┌────────┴────────┐
                   │  Agent Loop     │
                   │  (tools:        │
                   │  retrieve,      │
                   │  ship30_essay,  │
                   │  gen_artifact)  │
                   └────────┬────────┘
                            │
               ┌────────────┴────────────┐
               │  Groq (Primary LLM)     │
               └─────────────────────────┘
```

**Note:** The system uses Groq's free API to simulate lightning-fast inference, serving as an effective substitute for local LLMs (like Ollama). For an in-depth dive, check out `architecture.md`.

---

## 🚀 Quick Start

### Prerequisites

- Docker + Docker Compose
- A Groq API key ([console.groq.com](https://console.groq.com))
- Node.js 20+ & Python 3.11+ (only if running outside Docker)

### Setup

1. **Clone the repo:**
   ```bash
   git clone <this-repo>
   cd lenny-growth-assistant
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env and insert your GROQ_API_KEY and other details
   ```

3. **Start the application:**
   ```bash
   docker compose up --build
   ```
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000
   - **API health check:** http://localhost:8000/health

4. **First-run Ingestion (Crucial):**
   The knowledge base must be populated before the RAG features will work.
   ```bash
   docker compose exec backend python -m app.ingestion.run --source ./data/transcripts
   ```
   *This command parses the podcast transcripts, generates local embeddings, and writes them to pgvector.*

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Dark Glass Theme), react-markdown
- **Backend:** Python, FastAPI, Groq LLM API, Bleach (Sanitization)
- **Data & AI:** PostgreSQL, pgvector, sentence-transformers (Embeddings)

---

## ⚙️ Environment Variables

See `.env.example` for full options. Key variables:

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key for LLM inference |
| `DATABASE_URL` | Yes | Postgres connection string |
| `DEFAULT_PROVIDER` | No | Target LLM provider (default: `groq`) |
| `CORS_ORIGINS` | No | Frontend URL for CORS (default: `http://localhost:5173`) |

---

## 🧪 Testing

To run the backend test suite (covers chat endpoints, RAG retrieval thresholds, and session persistence):

```bash
docker compose exec backend pytest
```

See `TESTING.md` for a comprehensive manual UI test plan.

## ☁️ Deployment (Railway)

The fastest way to deploy this monorepo is using [Railway](https://railway.app/).

1. Create a new project on Railway and select **Deploy from GitHub repo**.
2. Select this repository. Railway will initially try to build the root. 
3. Go to the project dashboard and add a **PostgreSQL** database service.
4. Go to your backend service settings:
   - **Source:** Change the "Root Directory" to `/backend`.
   - **Variables:** Add `GROQ_API_KEY`, `CORS_ORIGINS` (set to your future frontend URL), and `DATABASE_URL` (use Railway's provided internal database URL).
5. Add a *second* GitHub service for the frontend:
   - **Source:** Change the "Root Directory" to `/frontend`.
   - **Variables:** Set `VITE_API_URL` to your backend's public Railway domain.
6. Connect to your Railway PostgreSQL database using a tool like TablePlus or `psql` and run:
   ```sql
   CREATE EXTENSION vector;
   ```
7. Finally, run the ingestion script on your backend service to populate the database.

---

## 📂 Project Structure

```text
/
├── backend/          # FastAPI app, agent tools, ingestion scripts, tests
├── frontend/         # React app with chat and artifact viewer
├── data/             # Local transcript data
├── PRD.md            # Product Requirements
├── architecture.md   # System Architecture details
├── design.md         # UI/UX and Component Design
├── TESTING.md        # Test Plans
├── docker-compose.yml
└── README.md
```
