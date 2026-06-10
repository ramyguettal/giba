from __future__ import annotations

from pydantic import BaseModel, Field


class ReportDraft(BaseModel):
    # Fields may be individually empty: the chat form enhances one field at a
    # time, possibly before the others are filled in.
    problem: str = ""
    cause: str = ""
    solution: str = ""
    machine_type: str = Field(min_length=1)
    locale: str | None = None


class ReformulatedReport(BaseModel):
    clean_problem: str
    clean_cause: str
    clean_solution: str


class ModifyReformulationRequest(BaseModel):
    clean_problem: str
    clean_cause: str
    clean_solution: str
    instruction: str = Field(min_length=1)
    locale: str | None = None


class CommitReportRequest(BaseModel):
    problem: str
    cause: str
    solution: str
    machine_type: str
    clean_problem: str
    clean_cause: str
    clean_solution: str
    locale: str | None = None


class CommitReportResponse(BaseModel):
    report_id: str


class ReportListItem(BaseModel):
    id: str
    user_id: str
    username: str
    machine_type: str
    problem: str
    cause: str
    solution: str
    clean_problem: str
    clean_cause: str
    clean_solution: str
    source: str
    is_indexed: bool
    created_at: str


class ReportListResponse(BaseModel):
    reports: list[ReportListItem]
    total: int
