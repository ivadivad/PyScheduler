import { useEffect, useRef, useState, useCallback } from "react";
import type { WsLogMessage, ExecutionLog } from "@/types";

const WS_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("http", "ws")
  : "";

export function useExecutionWebSocket(executionId: string | null) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const seqRef = useRef(0);

  const connect = useCallback(() => {
    if (!executionId) return;

    const url = `${WS_BASE}/ws/executions/${executionId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg: WsLogMessage = JSON.parse(event.data);
        if (msg.type === "log" && msg.message) {
          seqRef.current += 1;
          const entry: ExecutionLog = {
            id: `ws-${seqRef.current}`,
            execution_id: executionId,
            stream: msg.stream ?? "stdout",
            message: msg.message,
            sequence: msg.sequence ?? seqRef.current,
            timestamp: msg.timestamp ?? new Date().toISOString(),
          };
          setLogs((prev) => [...prev, entry]);
        } else if (msg.type === "status") {
          setFinalStatus(msg.status ?? null);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      // connection failed — not critical, logs are also stored in DB
    };
  }, [executionId]);

  useEffect(() => {
    setLogs([]);
    setFinalStatus(null);
    seqRef.current = 0;

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { logs, finalStatus };
}
