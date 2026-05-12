from __future__ import annotations

from pydantic import BaseModel, Field


class ManufacturerAlertRequest(BaseModel):
    title: str = Field(min_length=1)
    machine_type: str = Field(min_length=1)
    detail: str = Field(min_length=1)


class IngestionJobResponse(BaseModel):
    job_id: str
    status: str
    job_type: str
    machine_type: str
    title: str
    detail: str
    error: str = ""
