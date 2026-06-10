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

    def delete(self, report: Report) -> None:
        self.db.delete(report)
        self.db.commit()

    def count_all(self) -> int:
        return self.db.query(Report).count()

    def count_by_machine(self) -> dict[str, int]:
        from sqlalchemy import func
        rows = self.db.query(Report.machine_type, func.count()).group_by(Report.machine_type).all()
        return {r[0]: r[1] for r in rows}

    def get_recent(self, limit: int = 10) -> list[Report]:
        return self.db.query(Report).order_by(Report.created_at.desc()).limit(limit).all()

    def get_all(self, *, limit: int = 100, offset: int = 0) -> list[Report]:
        return (
            self.db.query(Report)
            .order_by(Report.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
