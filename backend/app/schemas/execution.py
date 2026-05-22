from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime


class ExecutionResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    trigger_type: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    duration_ms: Optional[int]
    exit_code: Optional[int]
    pid: Optional[int]
    retry_count: int
    error_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ExecutionWithJobResponse(ExecutionResponse):
    job_name: Optional[str] = None
    job_category: Optional[str] = None


class ExecutionListResponse(BaseModel):
    items: List[ExecutionWithJobResponse]
    total: int
    page: int
    page_size: int
