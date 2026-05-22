import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionStatusBadge } from "@/components/executions/execution-status-badge";
import { useExecutions, useCancelExecution } from "@/hooks/use-executions";
import { formatRelative, formatDuration } from "@/lib/utils";

const STATUS_FILTERS = ["all", "running", "success", "failed", "pending", "cancelled", "timeout"] as const;

export default function ExecutionsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useExecutions({
    page,
    page_size: 25,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const cancelExecution = useCancelExecution();
  const executions = data?.items ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : executions.length === 0 ? (
          <div className="py-16 text-center">
            <Play className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No executions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Job</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Trigger</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Started</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Exit</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec, i) => (
                <motion.tr
                  key={exec.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <ExecutionStatusBadge status={exec.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/executions/${exec.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {exec.job_name ?? "—"}
                    </Link>
                    {exec.job_category && (
                      <p className="text-xs text-muted-foreground">{exec.job_category}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground capitalize">{exec.trigger_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {exec.started_at ? formatRelative(exec.started_at) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono">{formatDuration(exec.duration_ms)}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-mono ${exec.exit_code === 0 ? "text-emerald-400" : exec.exit_code != null ? "text-red-400" : "text-muted-foreground"}`}>
                      {exec.exit_code ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {exec.status === "running" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelExecution.mutate(exec.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Cancel
                      </Button>
                    )}
                    <Link to={`/executions/${exec.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">View</Button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {(data?.total ?? 0) > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {((page - 1) * 25) + 1}–{Math.min(page * 25, data!.total)} of {data!.total}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="ghost" size="sm" disabled={page * 25 >= data!.total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
