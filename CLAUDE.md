# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GIBA is an AI-powered maintenance assistant for industrial machines (initially Husky HyPET5e injection molding machines, but machine types are data-driven). Users ask maintenance questions; the system retrieves relevant chunks from vectorized manuals/alerts via RAG and generates grounded answers.

## Two packages, no monorepo tool

| Package | Path | Entrypoint |
|---------|------|------------|
| Backend (FastAPI) | `backend/` | `app/main.py` (uvicorn) |
| Frontend (Next.js) | `frontend/` | `app/layout.tsx` (App Router) |

Each has its own deps, config, and commands — no shared workspace.

## Dev commands

```sh
# Full stack (needs DATABASE_URL in .env)
docker compose up

# Backend standalone (run from backend/)
uvicorn app.main:app --reload --port 8000

# DB migrations (run from backend/)
alembic upgrade head

# Frontend dev (run from frontend/)
npm run dev

# Frontend lint (run from frontend/)
eslint
```

No test framework is configured in either package.

## Environment setup

Copy `.env.example` to `.env`. Required variables:

- `DATABASE_URL` — Supabase Postgres connection string (SSL required, `DATABASE_SSLMODE=require`). For local dev, run `pgvector/pgvector:pg16` and use `DATABASE_SSLMODE=` (empty).
- `VOYAGE_API_KEY` — Voyage AI key for embeddings (`voyage-3.5`, 1024-dim)
- `OPENCODE_API_KEY` — key for the OpenCode Zen LLM (grounded answer generation). Optional: without it, retrieval works and chat falls back to a clarifying question.
- `JWT_SECRET` — for signing JWT tokens
- `SECRET_KEY` — app secret
- `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` / `BOOTSTRAP_ADMIN_ALLOWED_MACHINES` — seed an admin on startup

> **Embeddings vs. LLM**: Embeddings use Voyage AI (`app/services/embedding_service.py`, httpx → `https://api.voyageai.com/v1/embeddings`). The chat *answer* LLM is separate — OpenCode Zen via `app/clients/ai_client.py` (`https://opencode.ai/zen/go/v1`).

## Backend architecture

Layer order: `models/ → repositories/ → services/ → routers/`

- **`app/models/`** — SQLAlchemy ORM models (`User`, `Report`, `IngestionJob`, `AuditTrace`, `VectorDocument`)
- **`app/repositories/`** — DB access layer; one repo per model
- **`app/services/`** — business logic; injected with DB session via constructor
- **`app/routers/`** — FastAPI route handlers; delegate entirely to services
- **`app/clients/`** — external service wrappers (`AIClient` wrapping LangChain/OpenCode, `VectorStoreClient` wrapping pgvector)
- **`app/core/config.py`** — all settings via `pydantic-settings`; import `settings` singleton
- **`app/core/security.py`** — JWT decode and `UserContext` dataclass used across services
- **`app/core/dependencies.py`** — FastAPI dependency injection (`get_db`, `get_current_user`, etc.)

### Key services

- **`ChatService`** — orchestrates RAG retrieval → confidence check → LLM generation → audit trace. Confidence < 0.25 returns a clarification prompt instead of calling the LLM.
- **`RagService`** — embeds query (Voyage `voyage-3.5`, 1024-dim, `input_type="query"`), queries pgvector, computes confidence score.
- **`IngestionService`** — accepts PDF/text uploads or manufacturer alerts, chunks text, embeds, upserts to pgvector. Processing is **synchronous** (inline `_process_job`) despite `IngestionJob` having a `status` field — there is no separate async worker running.
- **`GenrativeAIServices`** — wraps `AIClient`; handles report reformulation and grounded answer generation via prompt templates. File has an intentional typo: `genrative_ai_services.py`.

### Auth

JWT access + refresh token pair. `User.allowed_machines` (JSONB array) controls which machine types a user can query or ingest. Every service that scopes to machine type checks this list.

## Frontend architecture

**Stack**: Next.js 16.2.4 + React 19 + Tailwind v4 + shadcn/ui (new-york style)

**Path alias**: `@/` → `frontend/` (root of the frontend package)

**Route groups**:
- `app/(app)/` — authenticated pages: `chat`, `dashboard`, `knowledge`, `settings`
- `app/(auth)/` — unauthenticated: `login`
- `app/api/` — Next.js API routes that proxy to the FastAPI backend (add auth headers, reshape responses)

**`lib/` directory** — shared client logic: `api.ts` (typed fetch wrappers over the `/api/*` routes), `types.ts` (domain types), `i18n.ts`/`i18n-server.ts` (en/fr dictionaries + cookie locale), `theme.ts`/`theme-server.ts`, `auth/session.ts` (cookie names, `getSessionUser`, `getAccessToken`, `canAccessMachine`), `utils.ts` (`cn`).

**Components**: top-level `components/` holds feature components (`chat-workspace`, `dashboard-overview`, `knowledge-admin`, etc.). `components/ui/` holds shadcn primitives.

**Hooks**: `use-auth.tsx` provides `AuthProvider` + `useAuth` context. `use-machine-scope.ts` derives the active machine filter from user context.

## Quirks & gotchas

- **Next.js 16.2.4** has breaking API changes. Always check `node_modules/next/dist/docs/` before writing Next.js-specific code (`frontend/AGENTS.md` flags this).
- **Tailwind v4** — PostCSS plugin is `@tailwindcss/postcss`, not the v3 `tailwindcss` plugin.
- **pgvector** lives in the same Supabase Postgres DB as relational tables — no separate vector service. Migrations 0002/0003 set it up.
- **`genrative_ai_services.py`** — the misspelling is intentional; do not rename.
- Alembic reads `DATABASE_URL` from env at runtime (`alembic/env.py`).
- Bootstrap admin on startup: if `BOOTSTRAP_ADMIN_USERNAME`/`BOOTSTRAP_ADMIN_PASSWORD` are set, `AuthService.ensure_bootstrap_admin()` creates the user.
- Structured JSON logging via `structlog`. Prometheus metrics at `/metrics`.
