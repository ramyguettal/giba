#!/usr/bin/env python3
"""Read-only verification of DB population.

Uses the app's configured database URL (from `app.core.config.settings`) and prints:
- sanitized connection info (no credentials)
- presence of `reports` / `vector_documents` tables across schemas
- row counts
- latest row (if any)

Exit code:
- 0 if any rows exist in `reports` or `vector_documents`
- 1 otherwise
"""

from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from sqlalchemy import text

# Ensure the backend root (parent of `scripts/`) is on sys.path so `import app` works
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.database.session import engine


def main() -> int:
    url = settings.get_database_url()
    parsed = urlsplit(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))

    print("=" * 80)
    print("DB CONNECTION (sanitized)")
    print("=" * 80)
    print(f"host={parsed.hostname}")
    print(f"port={parsed.port}")
    print(f"db={parsed.path.lstrip('/')}")
    print(f"driver={parsed.scheme}")
    print(f"sslmode={query.get('sslmode')}")
    print("=" * 80)

    try:
        with engine.connect() as conn:
            current_db, current_user = conn.execute(text("select current_database(), current_user")).fetchone()
            print(f"current_database={current_db}")
            print(f"current_user={current_user}")
            print(f"search_path={conn.execute(text('show search_path')).scalar()}")

            tables = conn.execute(
                text(
                    """
                    select table_schema, table_name
                    from information_schema.tables
                    where table_type = 'BASE TABLE'
                      and table_name in ('reports', 'vector_documents', 'users', 'alembic_version')
                    order by table_schema, table_name
                    """
                )
            ).fetchall()

            print(f"tables_found={tables}")

            totals: dict[str, int] = {}
            for schema, table in tables:
                count = conn.execute(text(f'SELECT COUNT(*) FROM "{schema}"."{table}"')).scalar()
                totals[f"{schema}.{table}"] = int(count or 0)

            for key in sorted(totals):
                print(f"{key}_rows={totals[key]}")

            if "public.alembic_version" in totals:
                version_num = conn.execute(text("select version_num from alembic_version limit 1")).scalar()
                print(f"alembic_version_num={version_num}")

            if "public.users" in totals:
                admin_exists = conn.execute(
                    text("select 1 from users where id = :id limit 1"),
                    {"id": "system-admin-machine-issues"},
                ).fetchone()
                print(f"system_admin_user_exists={admin_exists is not None}")

            if any(t[1] == "reports" for t in tables):
                latest_report = conn.execute(
                    text(
                        """
                        select id, machine_type, source, created_at
                        from reports
                        order by created_at desc nulls last
                        limit 1
                        """
                    )
                ).fetchone()
                print(f"reports_latest={latest_report}")

            if any(t[1] == "vector_documents" for t in tables):
                latest_vec = conn.execute(
                    text(
                        """
                        select id, machine_type, source, created_at
                        from vector_documents
                        order by created_at desc nulls last
                        limit 1
                        """
                    )
                ).fetchone()
                print(f"vector_documents_latest={latest_vec}")

            public_reports = totals.get("public.reports", 0)
            public_vectors = totals.get("public.vector_documents", 0)
            has_any = (public_reports + public_vectors) > 0

            print("=" * 80)
            if has_any:
                print("OK: data exists in public tables")
                return 0

            print("NOT OK: public tables are empty")
            return 1

    except Exception as exc:
        print(f"ERROR: failed to query database: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
