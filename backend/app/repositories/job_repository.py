from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from app.models.job import Job
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    def __init__(self, db: AsyncSession):
        super().__init__(Job, db)

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
    ) -> Tuple[List[Job], int]:
        query = select(Job)
        count_query = select(func.count(Job.id))

        filters = []
        if search:
            filters.append(or_(
                Job.name.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
            ))
        if status:
            filters.append(Job.status == status)
        if category:
            filters.append(Job.category == category)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(Job.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_active_enabled(self) -> List[Job]:
        result = await self.db.execute(
            select(Job).where(and_(Job.status == "active", Job.is_enabled == True, Job.schedule_type != None))
        )
        return list(result.scalars().all())

    async def update(self, job: Job, data: dict) -> Job:
        for key, value in data.items():
            if value is not None or key in ("scheduled_at", "description", "cron_expression"):
                setattr(job, key, value)
        await self.db.flush()
        await self.db.refresh(job)
        return job
