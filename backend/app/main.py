from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, jobs, executions, logs, dashboard, ws, scripts
from app.scheduler.scheduler import setup_scheduler, shutdown_scheduler
import app.models  # noqa: F401 — ensure models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start scheduler
    await setup_scheduler()
    yield

    # Shutdown
    await shutdown_scheduler()
    await engine.dispose()


app = FastAPI(
    title="Python Scheduler API",
    description="Orchestrate and schedule Python scripts with full lifecycle management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(executions.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(scripts.router, prefix="/api")
app.include_router(ws.router)


@app.get("/api/health")
async def health():
    from app.scheduler.scheduler import get_scheduler
    sch = get_scheduler()
    return {
        "status": "ok",
        "scheduler": "running" if sch and sch.running else "stopped",
    }
