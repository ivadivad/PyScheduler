import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True, default=list)

    script_path: Mapped[str] = mapped_column(String(500), nullable=False)
    script_args: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=list)
    env_vars: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=dict)

    priority: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    timeout: Mapped[int] = mapped_column(Integer, default=300, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    retry_delay: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    # cron | interval | once | daily | weekly | monthly
    schedule_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cron_expression: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    interval_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC", nullable=False)

    # active | paused | disabled
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_execution_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="jobs", lazy="noload")
    executions = relationship("Execution", back_populates="job", lazy="noload", cascade="all, delete-orphan")
