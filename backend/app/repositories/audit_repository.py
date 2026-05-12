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
