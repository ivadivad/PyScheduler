import { motion } from "framer-motion";
import { Activity, Cpu, Database, Zap, Server, Clock } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { useDashboardMetrics, useHealthCheck } from "@/hooks/use-dashboard";
import { useExecutions } from "@/hooks/use-executions";
import { ExecutionStatusBadge } from "@/components/executions/execution-status-badge";
import { formatRelative, formatDuration } from "@/lib/utils";

export default function MonitoringPage() {
  const { data: metrics } = useDashboardMetrics();
  const { data: health } = useHealthCheck();
  const { data: runningExecs } = useExecutions({ status: "running", page_size: 20 });

  const isHealthy = health?.status === "ok" && health?.scheduler === "running";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System health and real-time status</p>
      </div>

      {/* System Health */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "API Server",
              status: health?.status === "ok" ? "Healthy" : "Degraded",
              ok: health?.status === "ok",
              icon: Server,
            },
            {
              label: "Scheduler",
              status: health?.scheduler === "running" ? "Running" : "Stopped",
              ok: health?.scheduler === "running",
              icon: Clock,
            },
            {
              label: "Worker",
              status: "1 online",
              ok: true,
              icon: Cpu,
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg border p-4 flex items-center gap-3 ${item.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <div className={`p-2 rounded-lg ${item.ok ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                <item.icon className={`w-4 h-4 ${item.ok ? "text-emerald-400" : "text-red-400"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-semibold ${item.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {item.status}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ml-auto ${item.ok ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Jobs" value={metrics?.active_jobs ?? 0} icon={Zap} variant="success" />
        <MetricCard title="Running Now" value={metrics?.executions_running ?? 0} icon={Activity} variant="purple" />
        <MetricCard title="Success Today" value={metrics?.executions_success_today ?? 0} icon={Activity} variant="success" />
        <MetricCard title="Failures Today" value={metrics?.executions_failed_today ?? 0} icon={Activity} variant={metrics?.executions_failed_today ? "error" : "default"} />
      </div>

      {/* Currently Running */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <h2 className="font-semibold">Currently Running</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {runningExecs?.items?.length ?? 0} active
          </span>
        </div>

        {!runningExecs?.items?.length ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No executions currently running</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {runningExecs.items.map((exec) => (
              <motion.div
                key={exec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-3"
              >
                <ExecutionStatusBadge status={exec.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exec.job_name}</p>
                  <p className="text-xs text-muted-foreground">Started {exec.started_at ? formatRelative(exec.started_at) : "—"}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {formatDuration(exec.duration_ms)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
