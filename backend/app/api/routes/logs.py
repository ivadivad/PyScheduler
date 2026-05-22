from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid
from app.api.deps import get_db, get_current_user
from app.repositories.log_repository import LogRepository
from app.models.user import User

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/export")
async def export_logs(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = LogRepository(db)
    logs = await repo.get_all_for_export(execution_id)
    lines = [f"[{log.timestamp.isoformat()}] [{log.stream.upper()}] {log.message}" for log in logs]
    content = "\n".join(lines)
    return PlainTextResponse(
        content=content,
        headers={"Content-Disposition": f"attachment; filename=execution_{execution_id}.log"},
    )
