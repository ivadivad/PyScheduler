import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "MMM d, yyyy HH:mm");
  } catch {
    return "—";
  }
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

export function getScheduleLabel(job: {
  schedule_type: string | null;
  cron_expression?: string | null;
  interval_seconds?: number | null;
}): string {
  if (!job.schedule_type) return "Manual only";
  switch (job.schedule_type) {
    case "cron":
      return `Cron: ${job.cron_expression ?? "—"}`;
    case "interval":
      return job.interval_seconds ? `Every ${formatDuration(job.interval_seconds * 1000)}` : "Interval";
    case "once":
      return "One-time";
    case "daily":
      return "Daily at midnight";
    case "weekly":
      return "Weekly on Monday";
    case "monthly":
      return "Monthly on 1st";
    default:
      return job.schedule_type;
  }
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}
