export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type JobStatus = "active" | "paused" | "disabled";
export type ScheduleType = "cron" | "interval" | "once" | "daily" | "weekly" | "monthly";
export type ExecutionStatus = "pending" | "running" | "success" | "failed" | "cancelled" | "timeout";
export type TriggerType = "scheduled" | "manual" | "retry";

export interface Job {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  script_path: string;
  script_args: unknown[];
  env_vars: Record<string, string>;
  priority: number;
  timeout: number;
  max_retries: number;
  retry_delay: number;
  schedule_type: ScheduleType | null;
  cron_expression: string | null;
  interval_seconds: number | null;
  scheduled_at: string | null;
  timezone: string;
  status: JobStatus;
  is_enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_execution_status: ExecutionStatus | null;
  created_at: string;
  updated_at: string;
}

export interface JobFormData {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  script_path: string;
  script_args?: unknown[];
  env_vars?: Record<string, string>;
  priority: number;
  timeout: number;
  max_retries: number;
  retry_delay: number;
  schedule_type?: ScheduleType;
  cron_expression?: string;
  interval_seconds?: number;
  scheduled_at?: string;
  timezone: string;
  is_enabled: boolean;
}

export interface Execution {
  id: string;
  job_id: string;
  status: ExecutionStatus;
  trigger_type: TriggerType;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  exit_code: number | null;
  pid: number | null;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  job_name?: string;
  job_category?: string;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  stream: "stdout" | "stderr";
  message: string;
  sequence: number;
  timestamp: string;
}

export interface DashboardMetrics {
  total_jobs: number;
  active_jobs: number;
  paused_jobs: number;
  disabled_jobs: number;
  executions_today: number;
  executions_success_today: number;
  executions_failed_today: number;
  executions_running: number;
  next_execution: string | null;
  success_rate: number;
}

export interface TimelineItem {
  id: string;
  job_id: string;
  job_name: string;
  status: ExecutionStatus;
  trigger_type: TriggerType;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface WsLogMessage {
  type: "log" | "status";
  stream?: "stdout" | "stderr";
  message?: string;
  sequence?: number;
  timestamp?: string;
  status?: ExecutionStatus;
  exit_code?: number;
  duration_ms?: number;
}
