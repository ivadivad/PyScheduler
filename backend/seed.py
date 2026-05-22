"""
Seed script — creates admin user and sample jobs.
Usage: python seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.job import Job
import app.models  # noqa


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        # Create admin user
        existing = (await db.execute(select(User).where(User.email == "admin@scheduler.local"))).scalar_one_or_none()
        if not existing:
            admin = User(
                email="admin@scheduler.local",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                is_active=True,
            )
            db.add(admin)
            await db.flush()
            print(f"[seed] Created admin: admin@scheduler.local / admin123")
        else:
            admin = existing
            print(f"[seed] Admin already exists")

        # Create sample jobs
        jobs_data = [
            {
                "name": "Hello World",
                "description": "Simple hello world script — good for testing connectivity.",
                "category": "Examples",
                "tags": ["example", "test"],
                "script_path": "hello_world.py",
                "schedule_type": "interval",
                "interval_seconds": 300,
                "timeout": 30,
                "priority": 3,
                "is_enabled": True,
            },
            {
                "name": "Data Processor",
                "description": "Simulates data processing with progress output.",
                "category": "Data",
                "tags": ["data", "etl", "processing"],
                "script_path": "data_processor.py",
                "schedule_type": "cron",
                "cron_expression": "0 * * * *",
                "timeout": 120,
                "max_retries": 2,
                "retry_delay": 30,
                "priority": 7,
                "is_enabled": True,
            },
            {
                "name": "Report Generator",
                "description": "Generates daily summary reports.",
                "category": "Reports",
                "tags": ["report", "daily"],
                "script_path": "report_generator.py",
                "schedule_type": "daily",
                "timeout": 60,
                "priority": 5,
                "is_enabled": False,
            },
        ]

        for jd in jobs_data:
            exists = (await db.execute(select(Job).where(Job.name == jd["name"]))).scalar_one_or_none()
            if not exists:
                job = Job(**jd, created_by=admin.id, status="active" if jd.get("is_enabled") else "disabled")
                db.add(job)
                print(f"[seed] Created job: {jd['name']}")

        await db.commit()
        print("[seed] Done!")


if __name__ == "__main__":
    asyncio.run(seed())
