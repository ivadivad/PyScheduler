from typing import Optional, List, Tuple
from datetime import datetime, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job_repository import JobRepository
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate


class JobService:
    def __init__(self, db: AsyncSession):
        self.repo = JobRepository(db)

    async def list(self, page: int, page_size: int, search: str = None, status: str = None, category: str = None):
        return await self.repo.list(page, page_size, search, status, category)

    async def get(self, job_id: uuid.UUID) -> Optional[Job]:
        return await self.repo.get(job_id)

    async def create(self, data: JobCreate, user_id: uuid.UUID) -> Job:
        job = Job(
            name=data.name,
            description=data.description,
            category=data.category,
            tags=data.tags or [],
            script_path=data.script_path,
            script_args=data.script_args or [],
            env_vars=data.env_vars or {},
            priority=data.priority,
            timeout=data.timeout,
            max_retries=data.max_retries,
            retry_delay=data.retry_delay,
            schedule_type=data.schedule_type,
            cron_expression=data.cron_expression,
            interval_seconds=data.interval_seconds,
            scheduled_at=data.scheduled_at,
            timezone=data.timezone,
            is_enabled=data.is_enabled,
            status="active" if data.is_enabled else "disabled",
            created_by=user_id,
        )
        return await self.repo.create(job)

    async def update(self, job: Job, data: JobUpdate) -> Job:
        update_data = data.model_dump(exclude_unset=True)
        if "is_enabled" in update_data:
            if not update_data["is_enabled"]:
                update_data.setdefault("status", "disabled")
            elif job.status == "disabled":
                update_data.setdefault("status", "active")
        update_data["updated_at"] = datetime.now(timezone.utc)
        return await self.repo.update(job, update_data)

    async def delete(self, job: Job) -> None:
        await self.repo.delete(job)

    async def duplicate(self, job: Job, user_id: uuid.UUID) -> Job:
        new_job = Job(
            name=f"{job.name} (copy)",
            description=job.description,
            category=job.category,
            tags=job.tags,
            script_path=job.script_path,
            script_args=job.script_args,
            env_vars=job.env_vars,
            priority=job.priority,
            timeout=job.timeout,
            max_retries=job.max_retries,
            retry_delay=job.retry_delay,
            schedule_type=job.schedule_type,
            cron_expression=job.cron_expression,
            interval_seconds=job.interval_seconds,
            scheduled_at=job.scheduled_at,
            timezone=job.timezone,
            is_enabled=False,
            status="disabled",
            created_by=user_id,
        )
        return await self.repo.create(new_job)

    async def pause(self, job: Job) -> Job:
        return await self.repo.update(job, {"status": "paused"})

    async def resume(self, job: Job) -> Job:
        return await self.repo.update(job, {"status": "active"})

    async def get_active_enabled(self) -> List[Job]:
        return await self.repo.get_active_enabled()
