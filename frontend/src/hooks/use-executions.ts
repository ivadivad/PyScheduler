import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executionsApi } from "@/lib/api";
import { toast } from "sonner";

export const EXEC_KEYS = {
  all: ["executions"] as const,
  list: (params?: object) => [...EXEC_KEYS.all, "list", params] as const,
  detail: (id: string) => [...EXEC_KEYS.all, "detail", id] as const,
  logs: (id: string) => [...EXEC_KEYS.all, "logs", id] as const,
};

export function useExecutions(params?: { page?: number; page_size?: number; job_id?: string; status?: string }) {
  return useQuery({
    queryKey: EXEC_KEYS.list(params),
    queryFn: () => executionsApi.list(params),
    refetchInterval: 5000,
  });
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: EXEC_KEYS.detail(id),
    queryFn: () => executionsApi.get(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "running" || status === "pending") return 2000;
      return false;
    },
  });
}

export function useExecutionLogs(id: string) {
  return useQuery({
    queryKey: EXEC_KEYS.logs(id),
    queryFn: () => executionsApi.logs(id, { page_size: 500 }),
    enabled: !!id,
  });
}

export function useCancelExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => executionsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXEC_KEYS.all });
      toast.success("Execution cancelled");
    },
    onError: () => toast.error("Failed to cancel execution"),
  });
}
