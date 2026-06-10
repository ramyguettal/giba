# GIBA — Application Overview

GIBA is an AI-powered maintenance assistant for industrial machines (initially the Husky
HyPET5e injection molding machine, but machine types are data-driven via each user's
`allowed_machines` list). Maintenance technicians ask natural-language questions about a
machine; the system retrieves the most relevant chunks from vectorized manuals,
manufacturer alerts, and past repair reports (RAG), then generates a grounded,
citation-backed answer.

This document describes how the app works **end to end**, based on the current code in
this repository.

---

## 1. High-level architecture

```
┌─────────────────┐        ┌──────────────────────┐        ┌────────────────────────┐
│  Next.js frontend │ ───▶ │  Next.js API routes   │ ───▶  │   FastAPI backend       │
│  (React 19, App   │ ◀─── │  (app/api/* — proxy,  │ ◀───  │   (backend/app)         │
│   Router)         │      │   auth header inject) │       │                          │
└─────────────────┘        └──────────────────────┘        └───────────┬─────────────┘
                                                                          │
                                       ┌──────────────────────────────────┼────────────────────┐
                                       ▼                                  ▼                     ▼
                              Postgres + pgvector              Voyage AI (embeddings)   OpenRouter (LLM)
                              (users, reports, jobs,           voyage-3.5, 1024-dim     deepseek/deepseek-v4-flash
                               audit traces, vector_documents)                          for grounded answers
```

- **Two independent packages, no monorepo tooling.** `backend/` (FastAPI/Python) and
  `frontend/` (Next.js/TypeScript) each have their own dependencies and are run
  separately (or together via `docker compose up`).
- **Single database** (Supabase Postgres with the `pgvector` extension) holds both
  relational data (users, reports, ingestion jobs, audit traces) and vector embeddings
  (`vector_documents` table) — there is no separate vector DB service.
- **Two different AI providers**:
  - **Voyage AI** (`voyage-3.5`, 1024 dims) for embeddings only.
  - **OpenRouter** (`deepseek/deepseek-v4-flash`) for the chat/answer-generation LLM and
    for report reformulation. (A legacy `OPENCODE_*` config path still exists as a
    fallback — see §5.)

---

## 2. Backend (`backend/`)

FastAPI app, entrypoint `app/main.py`, run with `uvicorn app.main:app`.

### 2.1 Layering

```
app/models/        SQLAlchemy ORM models
app/repositories/   DB access layer (one repo per model)
app/services/       Business logic (constructor-injected DB session)
app/routers/        FastAPI route handlers — thin, delegate to services
app/clients/        External service wrappers (AI client, vector store client)
app/core/           Settings, security (JWT), dependencies, custom exceptions
app/middleware/      Correlation-ID + error-handling middleware
app/schemas/         Pydantic request/response models
app/utils/           Document processing (PDF text extraction, chunking)
```

### 2.2 Data model

| Table | Model | Purpose |
|---|---|---|
| `users` | `User` | username, bcrypt password hash, `role` (`admin`/`repairer`), `allowed_machines` (JSONB list of machine type strings) |
| `reports` | `Report` | Repair reports: raw `problem`/`cause`/`solution` fields entered by a technician, plus LLM-"cleaned" versions (`clean_problem`/`clean_cause`/`clean_solution`), a `combined_clean_text`, and `source` (`repairer`) |
| `ingestion_jobs` | `IngestionJob` | Tracks document ingestion (manuals or manufacturer alerts): `job_type`, `status` (`queued`/`processing`/`completed`/`failed`), `payload` (JSONB), `error` |
| `audit_traces` | `AuditTrace` | Every chat query: the question, the answer, confidence score, and the retrieved chunk IDs/metadata — for traceability |
| `vector_documents` | `VectorDocument` | pgvector table: `id` (e.g. `"<job_id>:<chunk_index>"` or a report's UUID), `machine_type`, `source`, `document` text, `metadata` JSONB, `embedding` (1024-dim vector) |

### 2.3 Authentication

- JWT access + refresh token pair (`app/core/security.py`), HS256, signed with
  `JWT_SECRET`.
- Access tokens carry `sub` (user id), `username`, `role`, and `allowed_machines` —
  so authorization checks don't require a DB hit.
- `User.allowed_machines` is the core authorization mechanism: every service that
  scopes data to a machine type (`ChatService`, `IngestionService`, `ReportService`)
  validates the requested `machine_type` against this list and raises
  `ForbiddenError` (HTTP 403) if not present.
- On startup, if `BOOTSTRAP_ADMIN_USERNAME`/`BOOTSTRAP_ADMIN_PASSWORD` are set,
  `AuthService.ensure_bootstrap_admin()` creates an admin user with
  `BOOTSTRAP_ADMIN_ALLOWED_MACHINES`.

### 2.4 Core services

#### `RagService` (`app/services/rag_service.py`)
Performs retrieval-augmented generation's "R":
1. Embeds the user's query via Voyage AI (`input_type="query"`).
2. Queries `vector_documents` (pgvector) filtered by a `where` clause built from the
   user's `allowed_machines` (or a specific `machine_type` if requested).
3. **Query expansion**: appends domain-specific keyword expansions (e.g. "error" →
   "fault code alarm diagnostic", "leak" → "seal hydraulic fluid oil") and runs a
   second retrieval pass to improve recall, merging results by best score.
4. Returns the top-k chunks sorted by similarity score (`1 - distance`).
5. **Confidence scoring** (`compute_confidence`): a weighted blend of the top score
   (55%), the average of the top 3 scores (30%), and the gap between the top two
   scores (15%) — producing a 0–1 confidence value.
6. **Confidence levels**: `high` (≥0.60), `medium` (≥0.35), `low` (otherwise).

#### `ChatService` (`app/services/chat_service.py`)
Orchestrates a chat turn:
1. Builds a machine-type filter from the user's `allowed_machines` (raises 403 if the
   user requests a machine they're not allowed to query).
2. Calls `RagService.retrieve()` and `compute_confidence()`.
3. **Confidence < 0.20** → returns a clarifying-question prompt instead of calling the
   LLM (`mode = "clarify"`).
4. **Confidence ≥ 0.20 and LLM configured** → builds a system prompt (GIBA persona:
   industrial maintenance expert for injection molding machines, must cite
   `[chunk_id]`, must flag LOTO/safety steps, prefers metric units), includes up to
   the last 6 turns of conversation history, and calls the LLM
   (`temperature=0.15`, `max_tokens=1500`) (`mode = "answer"`).
5. **LLM not configured** → falls back to returning the single best-matching chunk
   verbatim with its confidence score (`mode = "answer"`).
6. Every query (regardless of mode) is recorded as an `AuditTrace` — question, answer,
   confidence, and retrieved chunk IDs/metadata — for later analysis/dashboarding.

#### `IngestionService` (`app/services/ingestion_service.py`)
Handles uploading manuals and manufacturer alerts:
1. Validates the requesting user has access to the target `machine_type`.
2. Deduplicates by `(job_type, title, machine_type)` — if an identical job already
   exists, it's returned as-is rather than reprocessed.
3. Saves the uploaded file to `./data/uploads/<idempotency_key>.<ext>` (if a file was
   provided).
4. **Processing is synchronous** — `_process_job()` runs inline as part of the
   request, despite `IngestionJob.status` having `queued`/`processing`/`completed`/
   `failed` states. There is no separate background worker.
5. Extracts text from PDF/text files (`app/utils/document_processing.py`), detects the
   document type (manual vs. alert vs. other based on title/content heuristics),
   chunks the text with type-aware logic and per-chunk metadata (page numbers, doc
   type, machine type, job id, title).
6. Embeds all chunks via Voyage AI (`input_type="document"`) and upserts them into
   `vector_documents` with IDs `"<job_id>:<chunk_index>"`.
7. On any failure, marks the job `failed` with the error message; on success, marks it
   `completed` with a summary (`"Indexed N chunks (type: X)"`).

#### `ReportService` (`app/services/report_service.py`)
Manages technician repair reports — the human-generated knowledge that feeds back
into the RAG corpus:
1. **`reformulate()`** — takes a raw `ReportDraft` (problem/cause/solution in free-form
   text) and asks the LLM to produce cleaned-up versions (`clean_problem`,
   `clean_cause`, `clean_solution`). If no LLM is configured, fields pass through
   unchanged.
2. **`modify()`** — lets the user iterate on the reformulated text with a free-text
   instruction (e.g. "make it shorter"), again via the LLM.
3. **`commit()`** — persists the report (raw + cleaned fields) to the `reports` table,
   then *best-effort* embeds the combined cleaned text and upserts it into
   `vector_documents` with `source="repairer"` and `doc_type="report"` so future chat
   queries can retrieve it. If embedding fails, the report is still saved (vector
   indexing failure does not roll back the commit).
4. **`list_reports()`** — admin view of all reports, including whether each is
   currently indexed in the vector store (`is_indexed`), and the username of the
   author.
5. **`index_report()`** — (re)index a single report into the vector store on demand.

#### `GenrativeAIServices` (`app/services/genrative_ai_services.py`)
*(Filename typo is intentional — do not rename, per project convention.)*
Thin wrapper around `AIClient` providing:
- `.enabled` — true if an LLM API key is configured.
- `reformulate_report(...)` and `modify_reformulation(...)` — prompt templates for the
  report-cleanup flows used by `ReportService`.
- Exposes `.client` (the underlying `AIClient`) for `ChatService`'s direct
  `generate()` calls.

#### `EmbeddingService` (`app/services/embedding_service.py`)
Wraps Voyage AI's embeddings API (`https://api.voyageai.com/v1/embeddings`) via
`httpx`. `embed_text()` for single strings, `embed_texts()` for batches (chunked to
`VOYAGE_BATCH_SIZE`, default 128). Always specify `input_type` (`"query"` for chat
queries, `"document"` for ingestion/reports) — Voyage's asymmetric embeddings perform
better when query/document roles are distinguished.

### 2.5 Clients (`app/clients/`)

- **`AIClient`** — wraps the chat-completion LLM (OpenRouter / `deepseek-v4-flash` by
  default, see §5 for the legacy OpenCode fallback). Exposes `generate(messages,
  temperature, max_tokens)`.
- **`VectorStoreClient`** — wraps pgvector access via the `vector_documents` table:
  `query(query_embedding, where, top_k)` for similarity search (cosine distance) with
  metadata filters (e.g. `{"machine_type": {"$in": [...]}}`), and
  `upsert_documents(ids, documents, embeddings, metadatas)` for ingestion.

### 2.6 Routers / API surface

| Prefix | Router | Purpose |
|---|---|---|
| `/auth` | `auth.py` | login, refresh, logout, current-user info |
| `/chat` | `chat.py` | `POST /chat/query` — main RAG chat endpoint |
| `/ingestion` | `ingestion.py` | upload manuals, submit manufacturer alerts, check job status |
| `/reports` | `reports.py` | reformulate/modify/commit repair reports, list reports (admin), index a report |
| `/` (no prefix) | `dashboard.py` | aggregate stats for the admin dashboard |
| `/` (no prefix) | `health.py` | health check |
| `/metrics` | (Prometheus instrumentator) | Prometheus metrics |

All routers are thin — they parse the request, resolve the current user via DI
(`app/core/dependencies.py`), and delegate entirely to a service.

### 2.7 Cross-cutting concerns

- **Structured logging** via `structlog` (JSON), configured in `main.py`. Every
  request is logged with method, path, status, duration, IP, correlation ID, and user
  ID.
- **Correlation IDs** — `CorrelationIdMiddleware` attaches a per-request ID for
  tracing across logs.
- **Centralized error handling** — `app/middleware/error_handler.py` registers
  exception handlers for the custom exceptions in `app/core/exceptions.py`
  (`ForbiddenError` → 403, `NotFoundError` → 404, `UnauthorizedError` → 401, etc.).
- **CORS** — wide open (`*`) in development; restricted to `CORS_ALLOW_ORIGINS` /
  `NEXT_PUBLIC_API_URL` in other environments.
- **Database migrations** — Alembic, in `backend/alembic/versions/`. Migrations
  0002/0003 set up the `pgvector` extension and the `vector_documents` table /
  initial machine-issue data. `alembic/env.py` reads `DATABASE_URL` from the
  environment at runtime.

---

## 3. Frontend (`frontend/`)

Next.js 16.2.4 (App Router) + React 19 + Tailwind v4 + shadcn/ui (new-york style).
Path alias `@/` points at the `frontend/` package root.

### 3.1 Route groups

- **`app/(app)/`** — authenticated pages, wrapped by `AppShell`:
  - `/chat` — main chat interface (`chat-workspace.tsx`)
  - `/dashboard` — admin-only stats overview (`dashboard-overview.tsx`)
  - `/knowledge` — admin-only ingestion UI (`knowledge-admin.tsx`) for uploading
    manuals / manufacturer alerts and viewing job status
  - `/reports` — admin-only report review (`reports-admin.tsx`)
  - `/settings` — locale/theme preferences (`settings-panel.tsx`)
- **`app/(auth)/`** — unauthenticated `/login` page
- **`app/unauthorized/`** — shown when a non-admin hits an admin-only route
- **`app/api/`** — Next.js Route Handlers that proxy to the FastAPI backend, attaching
  the JWT from cookies and reshaping responses for the frontend's domain types
  (`lib/types.ts`)

### 3.2 Navigation & access control

`AppShell` (`components/app-shell.tsx`) renders the sidebar with nav items: Chat,
Knowledge (admin-only), Dashboard (admin-only), Reports (admin-only), Settings.
`adminOnly` items are filtered based on `user.role` (from `lib/auth/session.ts`'s
`getSessionUser()`), and `canAccessMachine()` / `use-machine-scope.ts` derive which
machine types the current user can act on, mirroring the backend's
`allowed_machines` checks.

### 3.3 Shared `lib/` modules

- **`api.ts`** — typed fetch wrappers for all `/api/*` routes
- **`types.ts`** — domain types shared across components (`User`, `ChatAnswer`,
  `Citation`, `ReportDraft`, `ReformulatedReport`, `IngestionJob`,
  `ReportListItem`, `DashboardStats`, etc.)
- **`auth/session.ts`** — cookie names, `getSessionUser()`, `getAccessToken()`,
  `canAccessMachine()`
- **`i18n.ts` / `i18n-server.ts`** — English/French dictionaries + cookie-based locale
- **`theme.ts` / `theme-server.ts`** — light/dark theme persistence
- **`utils.ts`** — `cn()` class-merging helper

### 3.4 Key user flows in the UI

1. **Chat** (`/chat`): user picks a machine type (scoped to `allowedMachineTypes`),
   types a question, sees the streamed/returned answer with a confidence badge
   (`high`/`medium`/`low`) and a list of citations (chunk id, source, snippet, score).
   If `mode === "clarify"`, the UI presents the clarifying question instead of an
   answer.
2. **Knowledge admin** (`/knowledge`, admin only): upload a manual (PDF/text) or
   submit a manufacturer alert (with optional file) for a given machine type; poll
   `IngestionJob` status (`queued`/`processing`/`completed`/`failed`).
3. **Reports admin** (`/reports`, admin only): technicians (or admins) draft a
   problem/cause/solution report, the LLM reformulates it into cleaned text, the user
   can iterate with free-text edit instructions, then commit — which saves the report
   and indexes it for future RAG retrieval. The reports list shows indexing status per
   report.
4. **Dashboard** (`/dashboard`, admin only): aggregate stats — total reports, total
   chat queries, count of low-confidence queries, active ingestion jobs, reports
   broken down by machine type, and recent activity feed.
5. **Settings**: locale (en/fr) and theme (light/dark) preferences, persisted via
   cookies through `app/api/preferences/*`.

---

## 4. End-to-end data flows

### 4.1 Chat query (RAG)
```
Frontend (chat-workspace) 
  → POST /api/chat/query  (Next.js route, attaches JWT)
    → POST /chat/query    (FastAPI)
      → ChatService.query()
          → RagService.retrieve()
              → EmbeddingService.embed_text(query, "query")  [Voyage AI]
              → VectorStoreClient.query(...)                 [pgvector]
              → (query expansion → second retrieval pass, merge)
          → RagService.compute_confidence()
          → if confidence < 0.20: clarify
            elif AI enabled: GenrativeAIServices/AIClient.generate(...) [OpenRouter]
            else: return best chunk verbatim
          → AuditRepository.create(AuditTrace)
      ← ChatQueryResponse {answer, confidence, confidence_level, citations, mode}
```

### 4.2 Document ingestion (manual or manufacturer alert)
```
Frontend (knowledge-admin) → upload file/form
  → POST /api/ingestion/manual | /api/ingestion/manufacturer-alert
    → POST /ingestion/...
      → IngestionService.enqueue_*()
          → validate machine access, dedupe check
          → save file to ./data/uploads/
          → create IngestionJob (status=queued)
          → _process_job()  [synchronous, inline]
              → extract_text_from_file()  [PDF/text → text + page metadata]
              → detect_doc_type()
              → chunk_with_metadata()
              → EmbeddingService.embed_texts(chunks, "document")  [Voyage AI]
              → VectorStoreClient.upsert_documents(...)            [pgvector]
              → IngestionJob.status = completed | failed
      ← IngestionJob (with final status)
```

### 4.3 Repair report → knowledge base
```
Frontend (reports-admin)
  → POST /api/reports/reformulate   → ReportService.reformulate()  [LLM cleanup]
  → POST /api/reports/modify        → ReportService.modify()       [LLM iteration]
  → POST /api/reports/commit        → ReportService.commit()
      → save Report row
      → embed combined_clean_text (best-effort) → upsert into vector_documents
        (source="repairer", doc_type="report")
```

---

## 5. Configuration (`backend/app/core/config.py`, `.env`)

All settings load via `pydantic-settings` from a `.env` file (auto-discovered by
walking up from cwd). Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` (+ `DATABASE_SSLMODE`) | Supabase Postgres connection (SSL required in prod; empty for local `pgvector/pgvector:pg16`) |
| `VOYAGE_API_KEY`, `VOYAGE_MODEL` (`voyage-3.5`), `VOYAGE_API_URL`, `VOYAGE_TIMEOUT`, `VOYAGE_BATCH_SIZE` | Embeddings |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (`deepseek/deepseek-v4-flash`), `OPENROUTER_BASE_URL` | Chat/answer-generation LLM (current provider) |
| `OPENCODE_API_KEY`, `OPENCODE_MODEL` | Legacy fallback — `settings.llm_*` properties prefer `OPENROUTER_*` if set, otherwise fall back to these (and `https://opencode.ai/zen/go/v1` as the base URL) |
| `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`, `JWT_REFRESH_EXPIRE_MINUTES` | Auth tokens |
| `SECRET_KEY` | General app secret |
| `BOOTSTRAP_ADMIN_USERNAME` / `_PASSWORD` / `_ALLOWED_MACHINES` | Seed an admin user on startup |
| `NEXT_PUBLIC_API_URL`, `CORS_ALLOW_ORIGINS` | Frontend origin / CORS |
| `VECTOR_TABLE`, `VECTOR_EMBEDDING_DIM` (1024) | pgvector table name and dimension |

> **Note on the LLM provider**: the project currently uses **OpenRouter**
> (`deepseek/deepseek-v4-flash`) as the chat LLM, configured via `OPENROUTER_API_KEY`.
> Embeddings remain on Voyage AI regardless of which LLM provider is active — these
> are independent concerns.

---

## 6. Running the project

```sh
# Full stack via Docker (requires .env with DATABASE_URL etc.)
docker compose up

# Backend standalone
cd backend && uvicorn app.main:app --reload --port 8000

# DB migrations
cd backend && alembic upgrade head

# Frontend dev server
cd frontend && npm run dev

# Frontend lint
cd frontend && eslint
```

No automated test suite is configured in either package.

---

## 7. Notable quirks & gotchas

- **Next.js 16.2.4** has breaking changes vs. older Next.js — check
  `frontend/node_modules/next/dist/docs/` before writing Next.js-specific code
  (enforced by `frontend/AGENTS.md`).
- **Tailwind v4** uses the `@tailwindcss/postcss` plugin, not the v3 `tailwindcss`
  plugin.
- **pgvector lives in the same Postgres DB** as the relational tables — no separate
  vector service to deploy or operate.
- **`genrative_ai_services.py`** — the misspelling is intentional and should not be
  "fixed".
- **Ingestion is synchronous** — large documents will block the request thread; the
  `IngestionJob.status` field exists for future async processing but there is
  currently no background worker (`app/workers/` is an empty placeholder).
- **Best-effort vector indexing for reports** — if embedding a committed report fails,
  the report is still saved; only the vector index entry is missing (visible via
  `is_indexed` in the reports admin list, and recoverable via `index_report()`).
