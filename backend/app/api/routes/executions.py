from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid
from app.api.deps import get_db, get_current_user
from app.services.execution_service import ExecutionService
from app.schemas.execution import ExecutionResponse, ExecutionWithJobResponse, ExecutionListResponse
from app.schemas.log import LogListResponse
from app.models.user import User

router = APIRouter(prefix="/executions", tags=["executions"])


@router.get("", response_model=ExecutionListResponse)
async def list_executions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = ExecutionService(db)
    items, total = await svc.list(page, page_size, job_id, status)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    execution = await ExecutionService(db).get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.post("/{execution_id}/cancel")
async def cancel_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = ExecutionService(db)
    success = await svc.cancel(execution_id)
    await db.commit()
    return {"cancelled": success}


@router.get("/{execution_id}/logs", response_model=LogListResponse)
async def get_execution_logs(
    execution_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=1000),
    stream: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = ExecutionService(db)
    items, total = await svc.get_logs(execution_id, page, page_size, stream)
    return {"items": items, "total": total, "page": page, "page_size": page_size}
