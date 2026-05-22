import { useQuery } from "@tanstack/react-query";
import { dashboardApi, healthApi } from "@/lib/api";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: dashboardApi.metrics,
    refetchInterval: 10000,
  });
}

export function useDashboardTimeline() {
  return useQuery({
    queryKey: ["dashboard", "timeline"],
    queryFn: dashboardApi.timeline,
    refetchInterval: 10000,
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: healthApi.check,
    refetchInterval: 15000,
  });
}
