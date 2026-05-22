from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime


class MetricsResponse(BaseModel):
    total_jobs: int
    active_jobs: int
    paused_jobs: int
    disabled_jobs: int
    executions_today: int
    executions_success_today: int
    executions_failed_today: int
    executions_running: int
    next_execution: Optional[datetime]
    success_rate: float


class TimelineItem(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    job_name: str
    status: str
    trigger_type: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    duration_ms: Optional[int]
    created_at: datetime


class TimelineResponse(BaseModel):
    items: List[TimelineItem]
