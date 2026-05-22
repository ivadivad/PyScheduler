import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Play, Ban, Timer } from "lucide-react";
import type { ExecutionStatus } from "@/types";
import { cn } from "@/lib/utils";

const CONFIG = {
  success: { label: "Success", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "error", icon: XCircle },
  running: { label: "Running", variant: "info", icon: Play, animate: true },
  pending: { label: "Pending", variant: "warning", icon: Clock },
  cancelled: { label: "Cancelled", variant: "secondary", icon: Ban },
  timeout: { label: "Timeout", variant: "error", icon: Timer },
} as const;

interface Props {
  status: ExecutionStatus;
  className?: string;
}

export function ExecutionStatusBadge({ status, className }: Props) {
  const config = CONFIG[status] ?? { label: status, variant: "secondary", icon: Clock };
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant as any}
      className={cn("flex items-center gap-1 w-fit", className)}
    >
      <Icon className={cn("w-3 h-3", (config as any).animate && "animate-pulse")} />
      {config.label}
    </Badge>
  );
}
