from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
import uuid
from datetime import datetime


class JobCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    script_path: str = Field(..., min_length=1)
    script_args: Optional[List[Any]] = []
    env_vars: Optional[Dict[str, str]] = {}
    priority: int = Field(default=5, ge=1, le=10)
    timeout: int = Field(default=300, ge=1, le=86400)
    max_retries: int = Field(default=0, ge=0, le=10)
    retry_delay: int = Field(default=60, ge=1)
    schedule_type: Optional[str] = None
    cron_expression: Optional[str] = None
    interval_seconds: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    timezone: str = "UTC"
    is_enabled: bool = True


class JobUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    script_path: Optional[str] = None
    script_args: Optional[List[Any]] = None
    env_vars: Optional[Dict[str, str]] = None
    priority: Optional[int] = None
    timeout: Optional[int] = None
    max_retries: Optional[int] = None
    retry_delay: Optional[int] = None
    schedule_type: Optional[str] = None
    cron_expression: Optional[str] = None
    interval_seconds: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    timezone: Optional[str] = None
    is_enabled: Optional[bool] = None
    status: Optional[str] = None


class JobResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    script_path: str
    script_args: Optional[List[Any]]
    env_vars: Optional[Dict[str, str]]
    priority: int
    timeout: int
    max_retries: int
    retry_delay: int
    schedule_type: Optional[str]
    cron_expression: Optional[str]
    interval_seconds: Optional[int]
    scheduled_at: Optional[datetime]
    timezone: str
    status: str
    is_enabled: bool
    next_run_at: Optional[datetime]
    last_run_at: Optional[datetime]
    last_execution_status: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    page_size: int
