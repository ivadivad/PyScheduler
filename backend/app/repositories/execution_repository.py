from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from app.models.execution import Execution
from app.models.job import Job
from app.repositories.base import BaseRepository
import uuid


class ExecutionRepository(BaseRepository[Execution]):
    def __init__(self, db: AsyncSession):
        super().__init__(Execution, db)

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        job_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[dict], int]:
        query = (
            select(Execution, Job.name.label("job_name"), Job.category.label("job_category"))
            .join(Job, Execution.job_id == Job.id)
        )
        count_query = select(func.count(Execution.id))

        filters = []
        if job_id:
            filters.append(Execution.job_id == job_id)
        if status:
            filters.append(Execution.status == status)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(Execution.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        rows = result.all()

        items = []
        for row in rows:
            exc = row[0]
            item = {
                "id": exc.id,
                "job_id": exc.job_id,
                "status": exc.status,
                "trigger_type": exc.trigger_type,
                "started_at": exc.started_at,
                "finished_at": exc.finished_at,
                "duration_ms": exc.duration_ms,
                "exit_code": exc.exit_code,
                "pid": exc.pid,
                "retry_count": exc.retry_count,
                "error_message": exc.error_message,
                "created_at": exc.created_at,
                "job_name": row[1],
                "job_category": row[2],
            }
            items.append(item)

        return items, total

    async def get_running_count(self) -> int:
        result = await self.db.execute(
            select(func.count(Execution.id)).where(Execution.status == "running")
        )
        return result.scalar_one()

    async def update_status(self, execution_id: uuid.UUID, status: str, **kwargs) -> Optional[Execution]:
        result = await self.db.execute(select(Execution).where(Execution.id == execution_id))
        execution = result.scalar_one_or_none()
        if execution:
            execution.status = status
            for key, value in kwargs.items():
                setattr(execution, key, value)
            await self.db.flush()
            await self.db.refresh(execution)
        return execution
