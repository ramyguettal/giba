# GIBA — AI Maintenance Assistant

## Two packages, no monorepo tool

| Package | Path | Entrypoint |
|---------|------|------------|
| Backend (FastAPI) | `backend/` | `app/main.py` (uvicorn) |
| Frontend (Next.js) | `frontend/` | `app/layout.tsx` (App Router) |

No shared workspace config — each has its own deps, config, and commands.

## Required dev commands

```sh
docker compose up          # starts Redis + backend + frontend (needs DATABASE_URL in .env)
uvicorn app.main:app --reload --port 8000   # backend standalone (from backend/)
npm run dev                # frontend dev (from frontend/)
alembic upgrade head       # run DB migrations (from backend/)
python -m app.workers.ingestion_worker      # async ingestion worker (from backend/)
```

## Key architecture facts

- **Vector store** = pgvector in the **same** Supabase Postgres DB (no separate vector service). Embedding dim is **1024** (Voyage AI `voyage-3.5`).
- **Embeddings** = Voyage AI via REST (`app/services/embedding_service.py`, httpx). Set `VOYAGE_API_KEY` in `.env`. `input_type` is `query` for retrieval, `document` for indexing.
- **LLM provider** (grounded answer generation, not embeddings) = OpenCode Zen, OpenAI-compatible (`app/clients/ai_client.py`). Set `OPENCODE_API_KEY`. Without it, retrieval still works and chat falls back to a clarifying question.
- **Auth** = JWT access + refresh tokens. Users have `allowed_machines` (JSONB) for role-based scoping.
- **Ingestion is synchronous** — `IngestionService._process_job` runs inline at enqueue time (embed + upsert). There is no separate Redis worker despite the `status` field.
- **Backend pattern**: `models/ → repositories/ → services/ → routers/`.
- **Frontend**: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (new-york style). `@/` → `frontend/`. Shared client logic lives in `frontend/lib/` (`api`, `types`, `i18n`, `theme`, `auth/session`).

## Quirks & gotchas

- **Next.js 16.2.4** — check `node_modules/next/dist/docs/` for breaking changes. The file `frontend/AGENTS.md` flags this.
- **Tailwind v4** — uses `@tailwindcss/postcss`, not the v3 PostCSS plugin.
- **Postgres** is Supabase-hosted, requires SSL (`sslmode=require`). Not in docker-compose — set `DATABASE_URL`. For local dev, run `pgvector/pgvector:pg16` and point `DATABASE_URL` at it with `DATABASE_SSLMODE=` (empty).
- **No test framework** configured in either package.
- `.gitignore` Python artifact ignores are anchored (`/lib/`, `/lib64/`) so they don't swallow `frontend/lib/`.
- `genrative_ai_services.py` spelling is intentionally kept (file exists with that name).
- Alembic resolves DB URL from `DATABASE_URL` env var at runtime (`alembic/env.py`).
- Frontend secret `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`.
- The repo was built for a specific use case (Husky HyPET5e injection molding machines), but machine types, manuals, and issues are data-driven.
