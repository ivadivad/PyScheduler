import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionStatusBadge } from "@/components/executions/execution-status-badge";
import { useExecutions } from "@/hooks/use-executions";
import { useExecutionLogs } from "@/hooks/use-executions";
import { LogViewer } from "@/components/logs/log-viewer";
import { formatRelative } from "@/lib/utils";

export default function LogsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: executions } = useExecutions({ page_size: 30 });
  const { data: logsData } = useExecutionLogs(selectedId ?? "");

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Browse execution logs across all jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-200px)] min-h-96">
        {/* Execution list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Recent Executions</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {executions?.items.map((exec) => (
              <button
                key={exec.id}
                onClick={() => setSelectedId(exec.id)}
                className={`w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors ${selectedId === exec.id ? "bg-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{exec.job_name}</span>
                  <ExecutionStatusBadge status={exec.status} />
                </div>
                <p className="text-xs text-muted-foreground">{formatRelative(exec.created_at)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Log viewer */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {selectedId ? `Execution ${selectedId.slice(0, 8)}…` : "Select an execution"}
            </p>
            {selectedId && (
              <Link to={`/executions/${selectedId}`}>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3 h-3" />
                  Open
                </Button>
              </Link>
            )}
          </div>
          <div className="flex-1 overflow-hidden p-4">
            {selectedId && logsData ? (
              <LogViewer
                logs={logsData.items}
                autoScroll={false}
                maxHeight="h-full"
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select an execution to view its logs</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
