# PRD — The Lenny Growth Assistant

**Author:** Nishit Patel
**Role context:** Forward Deployed Engineer Intern — Take-Home Assignment
**Status:** Draft v1

---

## 1. Problem & User

**Primary user:** A product manager or growth lead who wants fast, trustworthy answers to PM/growth questions, without reading through hundreds of hours of podcast transcripts themselves.

**Job to be done:** "I have a specific product/growth decision in front of me (pricing, onboarding, PMF signal, retention lever, etc.) — give me what practitioners who've actually done this have said, with a source I can go verify, not a generic LLM answer."

**Pain removed:** Today this user either (a) manually searches/skims Lenny's Podcast episodes hoping to find the relevant segment, or (b) asks a generic LLM and gets plausible-sounding but ungrounded, unverifiable advice. The assistant collapses both into: ask in plain language, get an answer traceable to a specific episode/transcript, and optionally turn that answer into a shareable artifact without leaving the tool.

**Secondary user:** The evaluator/client engineer who needs to run, verify, and extend this system in under 15 minutes.

---

## 2. Success Metrics

Primary (product): **Groundedness rate** — % of assistant answers that cite at least one specific transcript source, measured over a fixed eval set of ~20 representative PM/growth questions. Target: ≥90%. Answers with no supporting material must say so rather than fabricate (measured as **hallucination-on-empty-retrieval rate**, target: 0%).

Secondary (operational): **Time-to-first-response** (p50 latency, message → first token) under normal load — target under 4s for Claude, under 2s for Groq.

---

## 3. Assumptions

Recorded because the brief leaves these open:

1. Single-user, local/demo deployment — no multi-tenant auth. A `user_id` field exists in the schema for future multi-tenancy but isn't enforced with real auth in this build.
2. **"Local LLM — mandatory for the demo" is satisfied via Groq's free-tier API instead of Ollama.** This is a deliberate scope trade-off made under a compressed timeline (see Risks §7) — not a literal Ollama integration. The provider abstraction is written so Ollama is a drop-in swap (OpenAI-compatible interface) if required later.
3. **Anthropic Claude is accessed via Amazon Bedrock** (`CLAUDE_CODE_USE_BEDROCK=1` + AWS credentials) rather than a direct Anthropic API key — billed through AWS rather than an Anthropic account, at the same per-token cost. Still satisfies "at least one cloud provider" — the routing path, not the model, changed.
3. Transcript ingestion runs once at setup from a local clone of the linked repo, not a live scheduled re-crawl. "Refresh" = manual re-run of the ingestion script.
4. "Grounded" means retrieval-augmented (RAG) over chunked transcripts, not full long-context stuffing — the corpus is too large to fit in-context reliably.
5. Embeddings are generated locally via `sentence-transformers` — no embedding API cost or dependency.
6. Artifact rendering supports Markdown natively and a constrained HTML/CSS subset. Arbitrary `<script>` execution in generated HTML is out of scope for security reasons (§7).

---

## 4. Scope

**In scope:**
- RAG chat over Lenny's Podcast transcripts, with session persistence (Postgres)
- Source citation on every grounded answer
- Explicit "not enough information" response when retrieval returns nothing relevant
- Ship 30/30 essay-generation skill as a distinct, invokable tool
- Markdown + sanitized-HTML artifact generation with an in-app, sandboxed Artifact Viewer
- Model toggle: Anthropic Claude ↔ Groq, visible in UI, with documented fallback behavior
- Docker Compose one-command startup
- Structured logging across agent/retrieval/DB/artifact-render failure points
- Automated tests for API, retrieval, and persistence; manual test plan for UI

**Out of scope (explicitly excluded, with reasons):**
- Real Ollama integration — replaced with Groq (documented trade-off, §7)
- Multi-user auth/RBAC — single-user demo scope
- Live/scheduled transcript re-indexing — manual re-run only
- Arbitrary JS execution inside generated HTML artifacts — sanitized subset only, for security
- A polished design system — functional, accessible, responsive UI is the bar, not visual branding
- Fine-tuning or re-ranking models — cosine-similarity retrieval over `pgvector` is sufficient at this corpus size

---

## 5. User Flows

**Flow A — Grounded Q&A**
1. User starts a new session → gets a session ID, empty chat.
2. User asks a PM/growth question.
3. Backend retrieves top-k relevant transcript chunks via `pgvector` similarity search.
4. Agent (Claude Agent SDK) synthesizes an answer strictly from retrieved chunks, citing episode/source.
5. If retrieval returns nothing above a relevance threshold, the assistant explicitly says it lacks grounding, rather than answering from general knowledge.
6. Follow-up questions retain session context.

**Flow B — Ship 30/30 essay generation**
1. User asks the assistant to turn the current conversation (or a topic) into a Ship 30/30-style essay.
2. Agent invokes a dedicated `ship30_essay` tool encoding the format rules (hook, ~1,250 words, skimmable structure, single takeaway), re-grounded against the transcript KB.
3. Output renders as a Markdown artifact in the Artifact Viewer, not inline chat text.

**Flow C — Artifact generation**
1. User requests a document/snippet ("make this a one-pager", "give me an HTML card of this").
2. Agent generates Markdown or a constrained HTML/CSS snippet.
3. Frontend renders it in a sandboxed Artifact Viewer pane beside the chat.

**Flow D — Model toggle**
1. Evaluator selects Claude or Groq from a visible UI control (or config).
2. All subsequent turns in that session use the selected provider.
3. If the selected provider is unreachable (timeout, missing key), the system falls back to the other configured provider and surfaces this in the UI, rather than failing silently.

---

## 6. Acceptance Criteria

- [ ] A new chat session can be created and retrieved; messages persist in Postgres across backend restarts.
- [ ] Every grounded answer includes at least one identifiable transcript source (episode name/ID).
- [ ] Asking something outside the transcript corpus produces an explicit "insufficient grounding" response, not a fabricated answer.
- [ ] The Ship 30/30 skill is a separately invokable, testable unit — not string-concatenated into the main system prompt.
- [ ] Generated HTML artifacts render inside a sandboxed viewer that blocks top-level navigation and same-origin access; documented in `architecture.md`.
- [ ] The active provider (Claude/Groq) is visible in the UI at all times.
- [ ] `docker compose up` brings up API + DB with no manual steps beyond copying `.env.example` → `.env`.
- [ ] Missing API keys, unreachable provider, and empty retrieval each produce a clear, non-crashing error surfaced to the user.
- [ ] Automated tests cover: chat endpoint contract, retrieval relevance filtering, session persistence.

---

## 7. Risks & Trade-offs

| Risk | Mitigation |
|---|---|
| **Hallucination** on out-of-corpus questions | Relevance-threshold gate on retrieval; explicit "not grounded" response path; system prompt constrains the agent to cite-or-decline |
| **Ollama requirement not literally met** | Documented substitution with Groq (free, $0, equivalent "fast alternative provider" role); flagged here rather than concealed |
| **Claude Agent SDK + Bedrock has a known hang failure mode** (init message received, no response follows — open upstream issue) | Hard timeout on the Bedrock call path with automatic fallback to Groq; tested explicitly in Block 4, not assumed to work |
| **Bedrock model access approval delay** | AWS requires explicit model-access enablement per account/region before first call works — requested at project start, not on the day of the demo |
| **Latency** on free-tier providers under load | Groq is unusually fast even on its free tier; Claude is the quality fallback, not the latency-critical path |
| **Cost** | Every component chosen for $0 operation: Supabase free tier, local embeddings, Groq free tier, minimal demo-scale Claude usage |
| **Local-model quality** (Groq's small open models vs. Claude) | Retrieval quality matters more than generation model size for grounded QA; both providers held to the same citation requirement |
| **Data leakage** | No PII collected beyond a session identifier; transcripts are public data |
| **Unsafe artifact rendering** | Sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`), DOMPurify on HTML before render, no network calls from rendered artifacts |
| **Compressed timeline vs. assignment scope** | Ruthless prioritization: RAG correctness and grounding > UI polish > exhaustive test coverage — documented, not silently cut |

---

## 8. Implementation Plan

See `MASTER_PROMPT.md` for the block-by-block execution plan used to build this with an IDE coding agent, including review checkpoints between blocks.
