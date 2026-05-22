import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "error" | "warning" | "purple";
  loading?: boolean;
}

const variantStyles = {
  default: "border-border",
  success: "border-emerald-500/20 bg-emerald-500/5",
  error: "border-red-500/20 bg-red-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  purple: "border-purple-500/20 bg-purple-500/5",
};

const iconStyles = {
  default: "text-muted-foreground bg-secondary",
  success: "text-emerald-400 bg-emerald-500/15",
  error: "text-red-400 bg-red-500/15",
  warning: "text-amber-400 bg-amber-500/15",
  purple: "text-purple-400 bg-purple-500/15",
};

export function MetricCard({
  title, value, subtitle, icon: Icon, variant = "default", loading = false,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border bg-card p-5 overflow-hidden",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          {loading ? (
            <div className="mt-2 h-7 w-16 rounded bg-secondary animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          )}
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", iconStyles[variant])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}
