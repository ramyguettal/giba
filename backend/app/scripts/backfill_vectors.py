from __future__ import annotations

import argparse

from sqlalchemy.orm import Session

from app.clients.vector_store_client import VectorStoreClient
from app.database.session import SessionLocal
from app.models.report import Report
from app.models.vector_document import VectorDocument
from app.services.embedding_service import EmbeddingService


def _iter_reports(
    db: Session,
    *,
    machine_type: str | None,
    batch_size: int,
):
    query = db.query(Report).order_by(Report.created_at.asc())
    if machine_type:
        query = query.filter(Report.machine_type == machine_type)

    offset = 0
    while True:
        batch = query.offset(offset).limit(batch_size).all()
        if not batch:
            break
        yield batch
        offset += batch_size


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill pgvector (vector_documents) from existing relational records (reports)."
    )
    parser.add_argument("--machine-type", default=None, help="Only index reports for this machine type")
    parser.add_argument("--batch-size", type=int, default=50, help="Reports per batch")
    parser.add_argument("--limit", type=int, default=0, help="Max number of reports to index (0 = no limit)")
    parser.add_argument(
        "--reindex",
        action="store_true",
        help="Re-embed and upsert even if a vector row already exists",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be indexed without writing vectors",
    )

    args = parser.parse_args()
    if args.batch_size <= 0:
        raise SystemExit("--batch-size must be > 0")
    if args.limit < 0:
        raise SystemExit("--limit must be >= 0")

    db = SessionLocal()
    try:
        vstore = VectorStoreClient(db=db)
        embeddings = EmbeddingService()

        indexed = 0
        skipped = 0
        seen = 0

        for batch in _iter_reports(db, machine_type=args.machine_type, batch_size=args.batch_size):
            if args.limit and indexed >= args.limit:
                break

            reports = batch
            seen += len(reports)

            report_ids = [str(r.id) for r in reports]

            existing_ids: set[str] = set()
            if not args.reindex and report_ids:
                rows = db.query(VectorDocument.id).filter(VectorDocument.id.in_(report_ids)).all()
                existing_ids = {str(r[0]) for r in rows}

            to_index: list[Report] = []
            for report in reports:
                if args.limit and indexed + len(to_index) >= args.limit:
                    break
                if (not args.reindex) and str(report.id) in existing_ids:
                    skipped += 1
                    continue
                if not (report.combined_clean_text or "").strip():
                    skipped += 1
                    continue
                to_index.append(report)

            if not to_index:
                continue

            ids = [str(r.id) for r in to_index]
            documents = [str(r.combined_clean_text) for r in to_index]
            metadatas = [
                {
                    "source": str(r.source or "repairer"),
                    "machine_type": str(r.machine_type),
                    "report_id": str(r.id),
                    "user_id": str(r.user_id),
                }
                for r in to_index
            ]

            if args.dry_run:
                indexed += len(ids)
                continue

            vecs = embeddings.embed_texts(documents)
            vstore.upsert_documents(ids=ids, documents=documents, embeddings=vecs, metadatas=metadatas)
            indexed += len(ids)

        print(
            {
                "seen_reports": seen,
                "indexed": indexed,
                "skipped": skipped,
                "dry_run": bool(args.dry_run),
                "reindex": bool(args.reindex),
                "machine_type": args.machine_type,
            }
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
