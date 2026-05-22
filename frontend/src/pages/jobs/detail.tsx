import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Pause, RotateCcw, Trash2, Copy,
  Calendar, Clock, Settings, Code, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { ExecutionStatusBadge } from "@/components/executions/execution-status-badge";
import {
  useJob, useRunJob, usePauseJob, useResumeJob,
  useDeleteJob, useDuplicateJob,
} from "@/hooks/use-jobs";
import { useExecutions } from "@/hooks/use-executions";
import { formatDate, formatRelative, formatDuration, getScheduleLabel } from "@/lib/utils";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id!);
  const { data: executions } = useExecutions({ job_id: id, page_size: 10 });

  const runJob = useRunJob();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const deleteJob = useDeleteJob();
  const duplicateJob = useDuplicateJob();

  const handleDelete = async () => {
    if (!job) return;
    if (confirm(`Delete job "${job.name}"?`)) {
      await deleteJob.mutateAsync(job.id);
      navigate("/jobs");
    }
  };

  if (isLoading || !job) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-8 w-48 bg-secondary animate-pulse rounded" />
        <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{job.name}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            {job.description && <p className="text-sm text-muted-foreground mt-0.5">{job.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => runJob.mutate(job.id)} className="gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Run Now
          </Button>
          {job.status === "active" ? (
            <Button size="sm" variant="outline" onClick={() => pauseJob.mutate(job.id)} className="gap-1.5">
              <Pause className="w-3.5 h-3.5" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => resumeJob.mutate(job.id)} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Resume
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => duplicateJob.mutate(job.id)}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:border-red-500/50">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Job Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            Configuration
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: "Script", value: job.script_path },
              { label: "Schedule", value: getScheduleLabel(job) },
              { label: "Timezone", value: job.timezone },
              { label: "Priority", value: job.priority },
              { label: "Timeout", value: `${job.timeout}s` },
              { label: "Max Retries", value: job.max_retries },
              { label: "Retry Delay", value: `${job.retry_delay}s` },
              { label: "Category", value: job.category ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="font-medium font-mono text-xs mt-0.5">{String(value)}</span>
              </div>
            ))}
          </div>
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Timeline
          </h2>
          {[
            { label: "Created", value: formatDate(job.created_at) },
            { label: "Last Run", value: job.last_run_at ? formatRelative(job.last_run_at) : "Never" },
            { label: "Next Run", value: job.next_run_at ? formatRelative(job.next_run_at) : "Not scheduled" },
            { label: "Last Status", value: job.last_execution_status ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col border-b border-border/50 pb-2 last:border-0 last:pb-0">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-medium mt-0.5">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution History */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            Execution History
          </h2>
          <Link to={`/executions?job_id=${job.id}`}>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
          </Link>
        </div>
        {!executions?.items?.length ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No executions yet — run the job to see history</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Trigger</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Started</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Duration</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Exit Code</th>
              </tr>
            </thead>
            <tbody>
              {executions.items.map((exec) => (
                <tr key={exec.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/executions/${exec.id}`}>
                      <ExecutionStatusBadge status={exec.status} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{exec.trigger_type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exec.started_at ? formatRelative(exec.started_at) : "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{formatDuration(exec.duration_ms)}</td>
                  <td className="px-4 py-3 text-xs font-mono">{exec.exit_code ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
