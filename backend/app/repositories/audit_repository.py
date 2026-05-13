from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.audit_trace import AuditTrace


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, trace: AuditTrace) -> AuditTrace:
        self.db.add(trace)
        self.db.commit()
        self.db.refresh(trace)
        return trace

    def count_all(self) -> int:
        return self.db.query(AuditTrace).count()

    def count_low_confidence(self, threshold: float = 0.5) -> int:
        return self.db.query(AuditTrace).filter(AuditTrace.confidence < threshold).count()

    def get_recent(self, limit: int = 10) -> list[AuditTrace]:
        return self.db.query(AuditTrace).order_by(AuditTrace.created_at.desc()).limit(limit).all()
