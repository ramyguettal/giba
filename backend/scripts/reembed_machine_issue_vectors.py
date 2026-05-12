#!/usr/bin/env python3
"""Re-embed seeded machine-issue vectors with real embeddings.

This replaces the dummy all-zero vectors that were inserted when
`sentence-transformers` was not available.

It targets vector_documents rows whose id starts with "machine_issue:".

Usage:
  python scripts/reembed_machine_issue_vectors.py
  python scripts/reembed_machine_issue_vectors.py --batch-size 16
  python scripts/reembed_machine_issue_vectors.py --limit 10
  python scripts/reembed_machine_issue_vectors.py --dry-run
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

from sqlalchemy import text

# Ensure backend root on sys.path so `import app` works when run from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import engine
from app.services.embedding_service import EmbeddingService


def _batched(items: list[tuple[str, str]], batch_size: int):
    for i in range(0, len(items), batch_size):
        yield items[i : i + batch_size]


def _as_vector_literal(vec: list[float]) -> str:
    # pgvector accepts a bracketed, comma-separated list.
    # Use a fixed precision to keep the literal reasonably sized.
    return "[" + ",".join(f"{float(x):.8f}" for x in vec) + "]"


def main() -> int:
    parser = argparse.ArgumentParser(description="Re-embed seeded machine issue vectors in Supabase")
    parser.add_argument("--id-prefix", default="machine_issue:", help="VectorDocument.id prefix to target")
    parser.add_argument("--batch-size", type=int, default=16, help="Documents per embedding batch")
    parser.add_argument("--limit", type=int, default=0, help="Max documents to process (0 = all)")
    parser.add_argument("--dry-run", action="store_true", help="Compute embeddings but do not write updates")
    args = parser.parse_args()

    if args.batch_size <= 0:
        raise SystemExit("--batch-size must be > 0")
    if args.limit < 0:
        raise SystemExit("--limit must be >= 0")

    prefix_like = f"{args.id_prefix}%"

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                select id, document
                from vector_documents
                where id like :prefix
                order by id
                """
            ),
            {"prefix": prefix_like},
        ).fetchall()

    items: list[tuple[str, str]] = [(str(r[0]), str(r[1])) for r in rows]
    if args.limit:
        items = items[: args.limit]

    if not items:
        print({"updated": 0, "targeted": 0, "prefix": args.id_prefix})
        return 0

    print({"targeted": len(items), "prefix": args.id_prefix, "batch_size": args.batch_size, "dry_run": args.dry_run})

    embeddings = EmbeddingService()

    updated = 0
    for batch in _batched(items, args.batch_size):
        ids = [doc_id for doc_id, _ in batch]
        docs = [doc for _, doc in batch]

        vecs = embeddings.embed_texts(docs)

        if args.dry_run:
            updated += len(ids)
            print({"processed": updated, "total": len(items)})
            continue

        params = [
            {
                "id": doc_id,
                "embedding": _as_vector_literal(vec),
            }
            for doc_id, vec in zip(ids, vecs)
        ]

        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    update vector_documents
                    set embedding = CAST(:embedding AS vector),
                        updated_at = now()
                    where id = :id
                    """
                ),
                params,
            )

        updated += len(ids)
        print({"updated": updated, "total": len(items)})

    # Sanity check: compute the L2 norm of one updated vector.
    with engine.connect() as conn:
        sample = conn.execute(
            text(
                """
                select id, embedding
                from vector_documents
                where id like :prefix
                limit 1
                """
            ),
            {"prefix": prefix_like},
        ).fetchone()

    if sample is not None:
        emb = sample[1]
        try:
            if isinstance(emb, str):
                s = emb.strip()
                if s.startswith("[") and s.endswith("]"):
                    s = s[1:-1]
                parts = [p.strip() for p in s.split(",") if p.strip()]
                emb_list = [float(p) for p in parts]
            else:
                emb_list = [float(x) for x in list(emb)]

            l2 = math.sqrt(sum(float(x) * float(x) for x in emb_list))
            nonzero = any(abs(float(x)) > 1e-12 for x in emb_list)
            print(
                {
                    "sample_id": str(sample[0]),
                    "dims": len(emb_list),
                    "l2_norm": round(l2, 6),
                    "nonzero": nonzero,
                    "min": round(min(emb_list), 6) if emb_list else None,
                    "max": round(max(emb_list), 6) if emb_list else None,
                }
            )
        except Exception:
            print({"sample_id": str(sample[0]), "embedding_type": type(sample[1]).__name__})

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
