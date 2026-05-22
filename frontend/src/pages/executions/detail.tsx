import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, XCircle, RefreshCw,
  Clock, Terminal, Hash, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExecutionStatusBadge } from "@/components/executions/execution-status-badge";
import { LogViewer } from "@/components/logs/log-viewer";
import { useExecution, useExecutionLogs, useCancelExecution } from "@/hooks/use-executions";
import { useExecutionWebSocket } from "@/hooks/use-websocket";
import { logsApi } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/utils";

export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: execution, isLoading } = useExecution(id!);
  const { data: logsData } = useExecutionLogs(id!);
  const { logs: wsLogs } = useExecutionWebSocket(
    execution?.status === "running" || execution?.status === "pending" ? id! : null
  );
  const cancelExecution = useCancelExecution();

  const isLive = execution?.status === "running" || execution?.status === "pending";
  const displayLogs = isLive && wsLogs.length > 0 ? wsLogs : (logsData?.items ?? []);
  const stdoutLogs = displayLogs.filter((l) => l.stream === "stdout");
  const stderrLogs = displayLogs.filter((l) => l.stream === "stderr");

  if (isLoading || !execution) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-8 w-48 bg-secondary animate-pulse rounded" />
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/executions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono">{execution.id.slice(0, 8)}…</h1>
              <ExecutionStatusBadge status={execution.status} />
              {isLive && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Job: <Link to={`/jobs/${execution.job_id}`} className="hover:text-primary transition-colors">{execution.job_id.slice(0, 8)}</Link>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isLive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelExecution.mutate(execution.id)}
              className="gap-1.5 text-red-400 border-red-500/30 hover:border-red-500"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </Button>
          )}
          <a
            href={logsApi.exportUrl(execution.id)}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export Logs
            </Button>
          </a>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: "Started", value: execution.started_at ? formatDate(execution.started_at) : "—" },
          { icon: Clock, label: "Duration", value: formatDuration(execution.duration_ms) },
          { icon: Hash, label: "Exit Code", value: execution.exit_code?.toString() ?? "—" },
          { icon: Cpu, label: "PID", value: execution.pid?.toString() ?? "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-3 flex items-center gap-2.5">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-mono font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error message */}
      {execution.error_message && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">Error</p>
          <p className="text-sm text-red-300/80 mt-1 font-mono">{execution.error_message}</p>
        </div>
      )}

      {/* Logs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Output Logs</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {displayLogs.length} lines {isLive ? "· live" : ""}
          </span>
        </div>

        <div className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="mb-3">
              <TabsTrigger value="all">All ({displayLogs.length})</TabsTrigger>
              <TabsTrigger value="stdout">stdout ({stdoutLogs.length})</TabsTrigger>
              <TabsTrigger value="stderr" className={stderrLogs.length > 0 ? "text-red-400" : ""}>
                stderr ({stderrLogs.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <LogViewer logs={displayLogs} autoScroll={isLive} maxHeight="h-[500px]" />
            </TabsContent>
            <TabsContent value="stdout">
              <LogViewer logs={stdoutLogs} autoScroll={isLive} maxHeight="h-[500px]" />
            </TabsContent>
            <TabsContent value="stderr">
              <LogViewer logs={stderrLogs} autoScroll={isLive} maxHeight="h-[500px]" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
