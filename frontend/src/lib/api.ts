import axios from "axios";
import type {
  TokenResponse, User, Job, JobFormData, Execution,
  ExecutionLog, DashboardMetrics, TimelineItem,
  PaginatedResponse,
} from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post<TokenResponse>(`${BASE_URL}/api/auth/refresh`, {
            refresh_token: refresh,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),
  me: () => apiClient.get<User>("/auth/me").then((r) => r.data),
};

// Jobs
export const jobsApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; status?: string; category?: string }) =>
    apiClient.get<PaginatedResponse<Job>>("/jobs", { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Job>(`/jobs/${id}`).then((r) => r.data),
  create: (data: JobFormData) => apiClient.post<Job>("/jobs", data).then((r) => r.data),
  update: (id: string, data: Partial<JobFormData>) => apiClient.put<Job>(`/jobs/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/jobs/${id}`),
  run: (id: string) => apiClient.post<Execution>(`/jobs/${id}/run`).then((r) => r.data),
  pause: (id: string) => apiClient.post<Job>(`/jobs/${id}/pause`).then((r) => r.data),
  resume: (id: string) => apiClient.post<Job>(`/jobs/${id}/resume`).then((r) => r.data),
  duplicate: (id: string) => apiClient.post<Job>(`/jobs/${id}/duplicate`).then((r) => r.data),
};

// Executions
export const executionsApi = {
  list: (params?: { page?: number; page_size?: number; job_id?: string; status?: string }) =>
    apiClient.get<PaginatedResponse<Execution>>("/executions", { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Execution>(`/executions/${id}`).then((r) => r.data),
  cancel: (id: string) => apiClient.post(`/executions/${id}/cancel`).then((r) => r.data),
  logs: (id: string, params?: { page?: number; page_size?: number; stream?: string }) =>
    apiClient.get<PaginatedResponse<ExecutionLog>>(`/executions/${id}/logs`, { params }).then((r) => r.data),
};

// Dashboard
export const dashboardApi = {
  metrics: () => apiClient.get<DashboardMetrics>("/dashboard/metrics").then((r) => r.data),
  timeline: () => apiClient.get<{ items: TimelineItem[] }>("/dashboard/timeline").then((r) => r.data),
};

// Logs
export const logsApi = {
  exportUrl: (executionId: string) => `${BASE_URL}/api/logs/export?execution_id=${executionId}`,
};

// Scripts
export const scriptsApi = {
  list: () => apiClient.get<{ scripts: string[] }>("/scripts").then((r) => r.data),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const token = localStorage.getItem("access_token");
    // Use axios directly — apiClient sets Content-Type: application/json globally,
    // which overrides the multipart/form-data+boundary that axios auto-sets for FormData.
    return axios.post<{ filename: string }>(`${BASE_URL}/api/scripts/upload`, form, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((r) => r.data);
  },
};

// Health
export const healthApi = {
  check: () => apiClient.get<{ status: string; scheduler: string }>("/health").then((r) => r.data),
};
