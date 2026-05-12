from __future__ import annotations

from pydantic import BaseModel, Field


class ReportDraft(BaseModel):
    problem: str = Field(min_length=1)
    cause: str = Field(min_length=1)
    solution: str = Field(min_length=1)
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
