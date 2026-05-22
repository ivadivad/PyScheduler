import { Badge } from "@/components/ui/badge";
import { Zap, PauseCircle, XCircle } from "lucide-react";
import type { JobStatus } from "@/types";

const CONFIG = {
  active: { label: "Active", variant: "success", icon: Zap },
  paused: { label: "Paused", variant: "warning", icon: PauseCircle },
  disabled: { label: "Disabled", variant: "secondary", icon: XCircle },
} as const;

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = CONFIG[status] ?? CONFIG.disabled;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
