from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.log import ExecutionLog
from app.repositories.base import BaseRepository
import uuid


class LogRepository(BaseRepository[ExecutionLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(ExecutionLog, db)

    async def list_by_execution(
        self,
        execution_id: uuid.UUID,
        page: int = 1,
        page_size: int = 200,
        stream: Optional[str] = None,
    ) -> Tuple[List[ExecutionLog], int]:
        filters = [ExecutionLog.execution_id == execution_id]
        if stream:
            filters.append(ExecutionLog.stream == stream)

        count_query = select(func.count(ExecutionLog.id)).where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = (
            select(ExecutionLog)
            .where(and_(*filters))
            .order_by(ExecutionLog.sequence.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_all_for_export(self, execution_id: uuid.UUID) -> List[ExecutionLog]:
        result = await self.db.execute(
            select(ExecutionLog)
            .where(ExecutionLog.execution_id == execution_id)
            .order_by(ExecutionLog.sequence.asc())
        )
        return list(result.scalars().all())

    async def add_log(self, execution_id: uuid.UUID, message: str, stream: str, sequence: int) -> ExecutionLog:
        log = ExecutionLog(
            execution_id=execution_id,
            message=message,
            stream=stream,
            sequence=sequence,
        )
        self.db.add(log)
        await self.db.flush()
        return log
