# The Lenny Growth Assistant

A grounded, RAG-powered conversational assistant over Lenny's Podcast transcripts — with source citations, a Ship 30/30 essay-writing skill, and an in-app Artifact Viewer for generated Markdown/HTML.

> Built as a Forward Deployed Engineer Intern take-home assignment. See `PRD.md` for product rationale, `architecture.md` for system design, and `design.md` for UI/UX decisions.

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  React UI   │◄────►│  FastAPI     │◄────►│  Postgres        │
│  (chat +    │      │  backend     │      │  + pgvector      │
│  artifact   │      │  (agent      │      │  (sessions,      │
│  viewer)    │      │  routing)    │      │  messages,       │
└─────────────┘      └──────┬───────┘      │  transcript      │
                             │               │  embeddings)     │
                    ┌────────┴────────┐     └─────────────────┘
                    │  Claude Agent   │
                    │  SDK            │
                    │  (tools:        │
                    │  retrieve,      │
                    │  ship30_essay,  │
                    │  gen_artifact)  │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼──────┐         ┌────────▼───────┐
        │  Anthropic    │         │  Groq          │
        │  Claude API   │         │  (free-tier,   │
        │  (primary     │         │  local-LLM     │
        │  cloud)       │         │  slot swap —   │
        └───────────────┘         │  see PRD §3.2) │
                                   └────────────────┘
```

**Note on the local-LLM requirement:** the assignment calls for Ollama as the mandatory local model for the demo. This build substitutes **Groq's free API** for that slot — documented as a deliberate, explicit trade-off in `PRD.md` §3 and §7, not a silent omission. The provider interface is written so Ollama can be swapped back in without touching application code (see `architecture.md` §"Model Configuration Layer").

---

## Prerequisites

- Docker + Docker Compose
- AWS account with Bedrock model access enabled for Claude (request this first — approval can take a while, do it before anything else)
- AWS credentials (access key + secret, or configured profile) with `bedrock:InvokeModel` permission
- A Groq API key, free ([console.groq.com](https://console.groq.com))
- Node.js 20+ (frontend dev only, not required if using Docker Compose)
- Python 3.11+ (backend dev only, not required if using Docker Compose)

---

## Setup

```bash
git clone <this-repo>
cd lenny-growth-assistant
cp .env.example .env
# fill in AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and GROQ_API_KEY in .env
docker compose up --build
```

Frontend: http://localhost:5173
Backend API: http://localhost:8000
API health check: http://localhost:8000/health

### First-run ingestion

The transcript knowledge base must be built once before the assistant has anything to ground answers in:

```bash
docker compose exec backend python -m app.ingestion.run --source ./data/transcripts
```

This clones/reads the [Lenny's Podcast transcript repository](https://github.com/ChatPRD/lennys-podcast-transcripts), chunks transcripts, generates local embeddings, and writes them into `pgvector`. Re-run this command any time the source transcripts change — there is no scheduled auto-refresh (documented assumption, see `PRD.md` §3.3).

---

## Environment Variables

See `.env.example` for the full list with inline documentation. Required:

| Variable | Required | Description |
|---|---|---|
| `CLAUDE_CODE_USE_BEDROCK` | Yes | Set to `1` — routes Claude Agent SDK through Amazon Bedrock instead of a direct Anthropic API key |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Yes | AWS credentials with `bedrock:InvokeModel` permission |
| `AWS_REGION` | Yes | Region where Claude model access is enabled in Bedrock |
| `ANTHROPIC_MODEL` | Yes | Bedrock model ID (e.g. `us.anthropic.claude-sonnet-...`), not a plain model name |
| `GROQ_API_KEY` | Yes | Cloud provider #2 (local-LLM slot substitute) |
| `DATABASE_URL` | Yes | Postgres connection string (Supabase or local) |
| `DEFAULT_PROVIDER` | No (default: `anthropic`) | `anthropic` (via Bedrock) or `groq` |

---

## Running Tests

```bash
docker compose exec backend pytest
```

Covers: chat endpoint contracts, retrieval relevance filtering/thresholding, session persistence round-trips. See `TESTING.md` for the manual UI test plan.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/health` returns 500 | DB not reachable | Check `DATABASE_URL`, confirm Postgres container is up |
| Chat returns "provider unavailable" | Missing/invalid API key, or provider timeout | Check `.env`, check provider status; system should auto-fallback to the other provider — check logs for which path was taken |
| Every answer says "not grounded" | Ingestion hasn't run yet, or corpus path is wrong | Re-run the ingestion command above |
| Artifact pane shows nothing | Generated content failed sanitization | Check backend logs for the sanitizer rejection reason |
| Chat request hangs indefinitely on Claude/Bedrock | Known Agent SDK + Bedrock issue (init message received, no response follows) | Add a hard timeout + fallback-to-Groq on the Bedrock call path; don't let one hang block the request |
| `AccessDeniedException` from Bedrock | Model access not yet approved/enabled in the AWS console for your account/region | Request model access in Bedrock console, wait for approval, confirm `AWS_REGION` matches the approved region |

---

## Repo Structure

```
/backend        FastAPI app, agent tools, ingestion, tests
/frontend       React app (chat + artifact viewer)
/data           Local transcript clone (gitignored)
/agent-logs     Coding-agent transcripts (secrets stripped)
PRD.md
architecture.md
design.md
TESTING.md
docker-compose.yml
.env.example
```
