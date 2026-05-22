import asyncio
import uuid
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from app.core.config import settings


_scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> Optional[AsyncIOScheduler]:
    return _scheduler


def _build_trigger(job):
    tz = job.timezone or "UTC"
    stype = job.schedule_type

    if stype == "cron" and job.cron_expression:
        parts = job.cron_expression.strip().split()
        if len(parts) == 5:
            return CronTrigger.from_crontab(job.cron_expression, timezone=tz)
    elif stype == "interval" and job.interval_seconds:
        return IntervalTrigger(seconds=job.interval_seconds, timezone=tz)
    elif stype == "once" and job.scheduled_at:
        return DateTrigger(run_date=job.scheduled_at, timezone=tz)
    elif stype == "daily":
        return CronTrigger(hour=0, minute=0, timezone=tz)
    elif stype == "weekly":
        return CronTrigger(day_of_week="mon", hour=0, minute=0, timezone=tz)
    elif stype == "monthly":
        return CronTrigger(day=1, hour=0, minute=0, timezone=tz)
    return None


async def _execute_job(job_id_str: str):
    """
    Called directly by AsyncIOScheduler as an async job function.
    AsyncIOScheduler natively schedules coroutines via asyncio.ensure_future(),
    avoiding the event-loop-in-thread problem that affected the old sync wrapper.
    """
    job_id = uuid.UUID(job_id_str)
    from app.core.database import AsyncSessionLocal
    from app.services.execution_service import ExecutionService
    from app.repositories.job_repository import JobRepository

    try:
        async with AsyncSessionLocal() as db:
            svc = ExecutionService(db)
            await svc.trigger(job_id, trigger_type="scheduled")
            await db.commit()
    except Exception as e:
        print(f"[scheduler] Error executing job {job_id_str}: {e}")
        return

    # Update next_run_at after execution
    try:
        sch = get_scheduler()
        if sch:
            aps_job = sch.get_job(job_id_str)
            if aps_job and aps_job.next_run_time:
                async with AsyncSessionLocal() as db:
                    repo = JobRepository(db)
                    j = await repo.get(job_id)
                    if j:
                        await repo.update(j, {"next_run_at": aps_job.next_run_time})
                    await db.commit()
    except Exception:
        pass


async def setup_scheduler() -> AsyncIOScheduler:
    global _scheduler

    # MemoryJobStore: simpler and more reliable than SQLAlchemyJobStore with Supabase.
    # Job persistence is handled by our own database; sync_jobs_from_db() reloads on startup.
    _scheduler = AsyncIOScheduler(
        jobstores={"default": MemoryJobStore()},
        job_defaults={"coalesce": True, "max_instances": 1, "misfire_grace_time": 60},
    )
    _scheduler.start()

    await sync_jobs_from_db()
    return _scheduler


async def sync_jobs_from_db():
    """Load all active enabled jobs from DB and register with APScheduler."""
    from app.core.database import AsyncSessionLocal
    from app.repositories.job_repository import JobRepository

    async with AsyncSessionLocal() as db:
        repo = JobRepository(db)
        jobs = await repo.get_active_enabled()
        for job in jobs:
            await register_job(job)
        await db.commit()


async def register_job(job):
    """Add or replace a job in the scheduler and update next_run_at."""
    sch = get_scheduler()
    if not sch:
        return

    trigger = _build_trigger(job)
    if not trigger:
        return

    job_id_str = str(job.id)
    try:
        sch.add_job(
            _execute_job,
            trigger=trigger,
            id=job_id_str,
            args=[job_id_str],
            replace_existing=True,
        )
        aps_job = sch.get_job(job_id_str)
        if aps_job and aps_job.next_run_time:
            from app.core.database import AsyncSessionLocal
            from app.repositories.job_repository import JobRepository

            async with AsyncSessionLocal() as db:
                repo = JobRepository(db)
                j = await repo.get(job.id)
                if j:
                    await repo.update(j, {"next_run_at": aps_job.next_run_time})
                await db.commit()
    except Exception as e:
        print(f"[scheduler] Failed to register job {job_id_str}: {e}")


async def unregister_job(job_id: uuid.UUID):
    sch = get_scheduler()
    if not sch:
        return
    try:
        sch.remove_job(str(job_id))
    except Exception:
        pass


async def pause_job(job_id: uuid.UUID):
    sch = get_scheduler()
    if not sch:
        return
    try:
        sch.pause_job(str(job_id))
    except Exception:
        pass


async def resume_job(job_id: uuid.UUID):
    sch = get_scheduler()
    if not sch:
        return
    try:
        sch.resume_job(str(job_id))
    except Exception:
        pass


async def shutdown_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
    _scheduler = None
