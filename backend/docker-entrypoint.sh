#!/bin/sh
set -e

# Apply database migrations before serving traffic. Safe to re-run: alembic
# no-ops when the schema is already at head.
echo "Running database migrations..."
alembic upgrade head

# Cloud platforms (Render, Railway, Fly, Cloud Run) inject PORT; default to
# 8000 for local docker runs.
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
