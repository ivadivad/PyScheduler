from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import MetricsResponse, TimelineResponse
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await DashboardService(db).get_metrics()


@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items = await DashboardService(db).get_timeline()
    return {"items": items}
