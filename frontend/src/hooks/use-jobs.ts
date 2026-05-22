import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api";
import type { JobFormData } from "@/types";
import { toast } from "sonner";

export const JOB_KEYS = {
  all: ["jobs"] as const,
  list: (params?: object) => [...JOB_KEYS.all, "list", params] as const,
  detail: (id: string) => [...JOB_KEYS.all, "detail", id] as const,
};

export function useJobs(params?: { page?: number; page_size?: number; search?: string; status?: string; category?: string }) {
  return useQuery({
    queryKey: JOB_KEYS.list(params),
    queryFn: () => jobsApi.list(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: JOB_KEYS.detail(id),
    queryFn: () => jobsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: JobFormData) => jobsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOB_KEYS.all });
      toast.success("Job created successfully");
    },
    onError: () => toast.error("Failed to create job"),
  });
}

export function useUpdateJob(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<JobFormData>) => jobsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOB_KEYS.all });
      toast.success("Job updated successfully");
    },
    onError: () => toast.error("Failed to update job"),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOB_KEYS.all });
      toast.success("Job deleted");
    },
    onError: () => toast.error("Failed to delete job"),
  });
}

export function useRunJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.run(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executions"] });
      toast.success("Job triggered successfully");
    },
    onError: () => toast.error("Failed to trigger job"),
  });
}

export function usePauseJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.pause(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOB_KEYS.all });
      toast.success("Job paused");
    },
    onError: () => toast.error("Failed to pause job"),
  });
}

export function useResumeJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.resume(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOB_KEYS.all });
      toast.success("Job resumed");
    },
    onError: () => toast.error("Failed to resume job"),
  });
}

export function useDuplicateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: JOB_KEYS.all });
      toast.success("Job duplicated");
    },
    onError: () => toast.error("Failed to duplicate job"),
  });
}
