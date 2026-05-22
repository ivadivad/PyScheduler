import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ExecutionLog } from "@/types";

interface LogViewerProps {
  logs: ExecutionLog[];
  autoScroll?: boolean;
  className?: string;
  maxHeight?: string;
}

function getLineColor(stream: string, message: string) {
  if (stream === "stderr") return "text-red-400";
  if (message.startsWith("[scheduler]")) return "text-purple-400";
  if (message.toLowerCase().includes("error")) return "text-red-300";
  if (message.toLowerCase().includes("warn")) return "text-amber-300";
  if (message.toLowerCase().includes("success") || message.toLowerCase().includes("complete")) return "text-emerald-300";
  return "text-slate-300";
}

export function LogViewer({ logs, autoScroll = true, className, maxHeight = "h-96" }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  if (logs.length === 0) {
    return (
      <div className={cn(
        "rounded-lg border border-border bg-[#0a0a0f] font-mono text-sm flex items-center justify-center",
        maxHeight, className
      )}>
        <p className="text-muted-foreground">No logs yet…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-[#0a0a0f] font-mono text-xs overflow-auto",
        maxHeight, className
      )}
    >
      <div className="p-4 space-y-0.5">
        {logs.map((log, i) => (
          <motion.div
            key={log.id ?? i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="flex gap-3 leading-5"
          >
            <span className="text-slate-600 select-none w-12 shrink-0 text-right">
              {String(log.sequence).padStart(4, "0")}
            </span>
            <span className="text-slate-600 shrink-0 hidden md:block">
              {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span className={cn("break-all", getLineColor(log.stream, log.message))}>
              {log.message}
            </span>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
