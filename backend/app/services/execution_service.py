import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.execution_repository import ExecutionRepository
from app.repositories.job_repository import JobRepository
from app.repositories.log_repository import LogRepository
from app.models.execution import Execution
from app.executor.python_executor import executor


class ExecutionService:
    def __init__(self, db: AsyncSession):
        self.exec_repo = ExecutionRepository(db)
        self.job_repo = JobRepository(db)
        self.log_repo = LogRepository(db)
        self.db = db

    async def list(self, page: int, page_size: int, job_id=None, status=None):
        return await self.exec_repo.list(page, page_size, job_id, status)

    async def get(self, execution_id: uuid.UUID) -> Optional[Execution]:
        return await self.exec_repo.get(execution_id)

    async def trigger(self, job_id: uuid.UUID, trigger_type: str = "manual") -> Execution:
        execution = Execution(
            job_id=job_id,
            status="pending",
            trigger_type=trigger_type,
        )
        self.db.add(execution)
        await self.db.flush()
        await self.db.refresh(execution)

        # Fire and forget — runs in background task
        asyncio.create_task(self._run(execution.id, job_id))
        return execution

    async def _run(self, execution_id: uuid.UUID, job_id: uuid.UUID):
        from app.core.database import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            exec_repo = ExecutionRepository(db)
            job_repo = JobRepository(db)
            log_repo = LogRepository(db)

            job = await job_repo.get(job_id)
            if not job:
                return

            execution = await exec_repo.update_status(
                execution_id,
                "running",
                started_at=datetime.now(timezone.utc),
            )
            await db.commit()

            async def on_log(stream: str, message: str, sequence: int):
                async with AsyncSessionLocal() as log_db:
                    log_db.add(__import__("app.models.log", fromlist=["ExecutionLog"]).ExecutionLog(
                        execution_id=execution_id,
                        message=message,
                        stream=stream,
                        sequence=sequence,
                    ))
                    await log_db.commit()

            result = await executor.execute(
                execution_id=execution_id,
                script_path=job.script_path,
                script_args=job.script_args,
                env_vars=job.env_vars,
                timeout=job.timeout,
                on_log=on_log,
            )

            finish_time = datetime.now(timezone.utc)
            exit_code = result["exit_code"]

            if result.get("error_message") and "timed out" in result["error_message"]:
                status = "timeout"
            elif exit_code == 0:
                status = "success"
            elif exit_code == -1 and execution.status == "cancelled":
                status = "cancelled"
            else:
                status = "failed"

            # Handle retries
            should_retry = (
                status == "failed"
                and job.max_retries > 0
                and (execution.retry_count if execution else 0) < job.max_retries
            )

            async with AsyncSessionLocal() as db2:
                exec_repo2 = ExecutionRepository(db2)
                job_repo2 = JobRepository(db2)

                await exec_repo2.update_status(
                    execution_id,
                    status,
                    finished_at=finish_time,
                    duration_ms=result["duration_ms"],
                    exit_code=exit_code,
                    pid=result.get("pid"),
                    error_message=result.get("error_message"),
                )

                job2 = await job_repo2.get(job_id)
                if job2:
                    await job_repo2.update(job2, {
                        "last_run_at": finish_time,
                        "last_execution_status": status,
                    })
                await db2.commit()

            if should_retry:
                await asyncio.sleep(job.retry_delay)
                async with AsyncSessionLocal() as db3:
                    retry_exec = Execution(
                        job_id=job_id,
                        status="pending",
                        trigger_type="retry",
                        retry_count=(execution.retry_count if execution else 0) + 1,
                    )
                    db3.add(retry_exec)
                    await db3.flush()
                    retry_id = retry_exec.id
                    await db3.commit()
                asyncio.create_task(self._run(retry_id, job_id))

    async def cancel(self, execution_id: uuid.UUID) -> bool:
        cancelled = await executor.cancel(execution_id)
        if cancelled:
            await self.exec_repo.update_status(execution_id, "cancelled", finished_at=datetime.now(timezone.utc))
        return cancelled

    async def get_logs(self, execution_id: uuid.UUID, page: int = 1, page_size: int = 200, stream=None):
        return await self.log_repo.list_by_execution(execution_id, page, page_size, stream)
