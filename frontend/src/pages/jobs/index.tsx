import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Search, Play, Pause, RotateCcw, Trash2,
  Copy, MoreHorizontal, Clock, Zap, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import {
  useJobs, useRunJob, usePauseJob, useResumeJob,
  useDeleteJob, useDuplicateJob,
} from "@/hooks/use-jobs";
import { formatRelative, getScheduleLabel } from "@/lib/utils";
import type { Job } from "@/types";

const STATUS_FILTERS = ["all", "active", "paused", "disabled"] as const;

export default function JobsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useJobs({
    page,
    page_size: 20,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const runJob = useRunJob();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const deleteJob = useDeleteJob();
  const duplicateJob = useDuplicateJob();

  const handleAction = async (action: string, job: Job) => {
    switch (action) {
      case "run": await runJob.mutateAsync(job.id); break;
      case "pause": await pauseJob.mutateAsync(job.id); break;
      case "resume": await resumeJob.mutateAsync(job.id); break;
      case "duplicate": await duplicateJob.mutateAsync(job.id); break;
      case "delete":
        if (confirm(`Delete job "${job.name}"?`)) await deleteJob.mutateAsync(job.id);
        break;
    }
  };

  const jobs = data?.items ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} jobs total
          </p>
        </div>
        <Link to="/jobs/create">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "ghost"}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className="capitalize text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Create your first job to get started"}
            </p>
            <Link to="/jobs/create">
              <Button size="sm" className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Create Job
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Job</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Schedule</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Last Run</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <Link to={`/jobs/${job.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                          {job.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          {job.category && (
                            <Badge variant="secondary" className="text-[10px] py-0 h-4">{job.category}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">{job.script_path}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {getScheduleLabel(job)}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs text-muted-foreground">
                      {job.last_run_at ? (
                        <span title={job.last_run_at}>{formatRelative(job.last_run_at)}</span>
                      ) : "Never"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Run now"
                        onClick={() => handleAction("run", job)}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                      {job.status === "active" ? (
                        <Button variant="ghost" size="icon" title="Pause" onClick={() => handleAction("pause", job)}>
                          <Pause className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" title="Resume" onClick={() => handleAction("resume", job)}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" title="Duplicate" onClick={() => handleAction("duplicate", job)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => handleAction("delete", job)}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {(data?.total ?? 0) > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data!.total)} of {data!.total}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="ghost" size="sm" disabled={page * 20 >= data!.total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
