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

- **Vector store** = pgvector in the **same** Supabase Postgres DB (no separate vector service). Embedding dim is 384 (all-MiniLM-L6-v2).
- **LLM provider** = Groq (llama3-70b-8192). Set `GROQ_API_KEY` in `.env`.
- **Auth** = JWT access + refresh tokens. Users have `allowed_machines` (JSONB) for role-based scoping.
- **Async ingestion** = Redis queue (`ingestion:jobs`) consumed by `ingestion_worker.py`.
- **Backend pattern**: `models/ → repositories/ → services/ → routers/`.
- **Frontend**: Next.js 16 + React 19 + Tailwind v4 + shadcn/ui (new-york style). `@/` → `frontend/`.

## Quirks & gotchas

- **Next.js 16.2.4** — check `node_modules/next/dist/docs/` for breaking changes. The file `frontend/AGENTS.md` flags this.
- **Tailwind v4** — uses `@tailwindcss/postcss`, not the v3 PostCSS plugin.
- **Postgres** is Supabase-hosted, requires SSL (`sslmode=require`). Not in docker-compose — set `DATABASE_URL`.
- **No test framework** configured in either package.
- `genrative_ai_services.py` spelling is intentionally kept (file exists with that name).
- Alembic resolves DB URL from `DATABASE_URL` env var at runtime (`alembic/env.py`).
- Frontend secret `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`.
- The repo was built for a specific use case (Husky HyPET5e injection molding machines), but machine types, manuals, and issues are data-driven.
