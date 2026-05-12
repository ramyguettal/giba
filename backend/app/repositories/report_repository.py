from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.report import Report


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, report: Report) -> Report:
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def get(self, report_id: str) -> Report | None:
        return self.db.query(Report).filter(Report.id == report_id).first()
