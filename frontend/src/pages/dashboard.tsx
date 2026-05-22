import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, CheckCircle2, XCircle, Play, Clock,
  TrendingUp, Zap, Activity, Plus,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ExecutionStatusBadge } from "@/components/executions/execution-status-badge";
import { Button } from "@/components/ui/button";
import { useDashboardMetrics, useDashboardTimeline } from "@/hooks/use-dashboard";
import { formatRelative, formatDuration, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: timeline } = useDashboardTimeline();

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System overview and recent activity</p>
        </div>
        <Link to="/jobs/create">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Job
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Jobs"
          value={metrics?.total_jobs ?? 0}
          subtitle={`${metrics?.active_jobs ?? 0} active`}
          icon={Briefcase}
          loading={metricsLoading}
        />
        <MetricCard
          title="Executions Today"
          value={metrics?.executions_today ?? 0}
          subtitle={`${metrics?.executions_running ?? 0} currently running`}
          icon={Play}
          variant="purple"
          loading={metricsLoading}
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics?.success_rate ?? 0}%`}
          subtitle={`${metrics?.executions_success_today ?? 0} succeeded today`}
          icon={TrendingUp}
          variant="success"
          loading={metricsLoading}
        />
        <MetricCard
          title="Failures Today"
          value={metrics?.executions_failed_today ?? 0}
          subtitle={metrics?.executions_running ? `${metrics.executions_running} running` : "No active runs"}
          icon={XCircle}
          variant={metrics?.executions_failed_today ? "error" : "default"}
          loading={metricsLoading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Jobs" value={metrics?.active_jobs ?? 0} icon={Zap} variant="success" loading={metricsLoading} />
        <MetricCard title="Paused Jobs" value={metrics?.paused_jobs ?? 0} icon={Clock} variant="warning" loading={metricsLoading} />
        <MetricCard title="Currently Running" value={metrics?.executions_running ?? 0} icon={Activity} variant="purple" loading={metricsLoading} />
        <MetricCard
          title="Next Execution"
          value={metrics?.next_execution ? formatRelative(metrics.next_execution) : "None scheduled"}
          icon={CheckCircle2}
          loading={metricsLoading}
        />
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Executions</h2>
            <Link to="/executions">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
            </Link>
          </div>

          <div className="space-y-2">
            {!timeline?.items?.length ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No executions yet</p>
              </div>
            ) : (
              timeline.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link to={`/executions/${item.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group">
                      <ExecutionStatusBadge status={item.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {item.job_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.trigger_type} · {formatRelative(item.created_at)}
                        </p>
                      </div>
                      {item.duration_ms != null && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDuration(item.duration_ms)}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Quick stats panel */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-4">System Status</h2>
          <div className="space-y-3">
            {[
              { label: "Scheduler", value: "Running", color: "text-emerald-400" },
              { label: "Workers", value: "1 online", color: "text-emerald-400" },
              { label: "Queue", value: "Active", color: "text-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                Next scheduled: {metrics?.next_execution ? formatDate(metrics.next_execution) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
