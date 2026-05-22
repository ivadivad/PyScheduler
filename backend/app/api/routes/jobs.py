from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid
from app.api.deps import get_db, get_current_user
from app.services.job_service import JobService
from app.services.execution_service import ExecutionService
from app.scheduler.scheduler import register_job, unregister_job, pause_job, resume_job
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobListResponse
from app.schemas.execution import ExecutionResponse
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = JobService(db)
    items, total = await svc.list(page, page_size, search, status, category)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = JobService(db)
    job = await svc.create(data, current_user.id)
    await db.commit()
    await db.refresh(job)
    if job.is_enabled and job.schedule_type:
        await register_job(job)
    return job


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    job = await JobService(db).get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    data: JobUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = JobService(db)
    job = await svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job = await svc.update(job, data)
    await db.commit()
    await db.refresh(job)
    if job.is_enabled and job.schedule_type and job.status == "active":
        await register_job(job)
    else:
        await unregister_job(job_id)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = JobService(db)
    job = await svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await unregister_job(job_id)
    await svc.delete(job)
    await db.commit()


@router.post("/{job_id}/run", response_model=ExecutionResponse)
async def run_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    job = await JobService(db).get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    svc = ExecutionService(db)
    execution = await svc.trigger(job_id, trigger_type="manual")
    await db.commit()
    await db.refresh(execution)
    return execution


@router.post("/{job_id}/pause", response_model=JobResponse)
async def pause_job_route(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = JobService(db)
    job = await svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job = await svc.pause(job)
    await db.commit()
    await pause_job(job_id)
    return job


@router.post("/{job_id}/resume", response_model=JobResponse)
async def resume_job_route(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = JobService(db)
    job = await svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job = await svc.resume(job)
    await db.commit()
    await db.refresh(job)
    if job.schedule_type:
        await register_job(job)
    return job


@router.post("/{job_id}/duplicate", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = JobService(db)
    job = await svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    new_job = await svc.duplicate(job, current_user.id)
    await db.commit()
    await db.refresh(new_job)
    return new_job
