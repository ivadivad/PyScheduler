import { type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import MainLayout from "@/components/layout/main-layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import JobsPage from "@/pages/jobs/index";
import CreateJobPage from "@/pages/jobs/create";
import JobDetailPage from "@/pages/jobs/detail";
import ExecutionsPage from "@/pages/executions/index";
import ExecutionDetailPage from "@/pages/executions/detail";
import LogsPage from "@/pages/logs";
import MonitoringPage from "@/pages/monitoring";
import SettingsPage from "@/pages/settings";
import NotFoundPage from "@/pages/not-found";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/create" element={<CreateJobPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="executions" element={<ExecutionsPage />} />
        <Route path="executions/:id" element={<ExecutionDetailPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
