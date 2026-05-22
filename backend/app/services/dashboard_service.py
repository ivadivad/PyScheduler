from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.job import Job
from app.models.execution import Execution


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_metrics(self) -> dict:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        total_jobs = (await self.db.execute(select(func.count(Job.id)))).scalar_one()
        active_jobs = (await self.db.execute(select(func.count(Job.id)).where(Job.status == "active"))).scalar_one()
        paused_jobs = (await self.db.execute(select(func.count(Job.id)).where(Job.status == "paused"))).scalar_one()
        disabled_jobs = (await self.db.execute(select(func.count(Job.id)).where(Job.status == "disabled"))).scalar_one()

        executions_today = (await self.db.execute(
            select(func.count(Execution.id)).where(Execution.created_at >= today_start)
        )).scalar_one()

        success_today = (await self.db.execute(
            select(func.count(Execution.id)).where(
                and_(Execution.created_at >= today_start, Execution.status == "success")
            )
        )).scalar_one()

        failed_today = (await self.db.execute(
            select(func.count(Execution.id)).where(
                and_(Execution.created_at >= today_start, Execution.status == "failed")
            )
        )).scalar_one()

        running = (await self.db.execute(
            select(func.count(Execution.id)).where(Execution.status == "running")
        )).scalar_one()

        next_exec = (await self.db.execute(
            select(func.min(Job.next_run_at)).where(
                and_(Job.status == "active", Job.is_enabled == True, Job.next_run_at != None)
            )
        )).scalar_one()

        success_rate = (success_today / executions_today * 100) if executions_today > 0 else 0.0

        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "paused_jobs": paused_jobs,
            "disabled_jobs": disabled_jobs,
            "executions_today": executions_today,
            "executions_success_today": success_today,
            "executions_failed_today": failed_today,
            "executions_running": running,
            "next_execution": next_exec,
            "success_rate": round(success_rate, 1),
        }

    async def get_timeline(self, limit: int = 20) -> list:
        result = await self.db.execute(
            select(Execution, Job.name.label("job_name"), Job.category.label("job_category"))
            .join(Job, Execution.job_id == Job.id)
            .order_by(Execution.created_at.desc())
            .limit(limit)
        )
        rows = result.all()
        items = []
        for row in rows:
            exc = row[0]
            items.append({
                "id": exc.id,
                "job_id": exc.job_id,
                "job_name": row[1],
                "status": exc.status,
                "trigger_type": exc.trigger_type,
                "started_at": exc.started_at,
                "finished_at": exc.finished_at,
                "duration_ms": exc.duration_ms,
                "created_at": exc.created_at,
            })
        return items
