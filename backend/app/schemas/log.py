from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime


class LogResponse(BaseModel):
    id: uuid.UUID
    execution_id: uuid.UUID
    stream: str
    message: str
    sequence: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class LogListResponse(BaseModel):
    items: List[LogResponse]
    total: int
    page: int
    page_size: int
