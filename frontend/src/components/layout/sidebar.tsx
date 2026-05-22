import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Briefcase, Play, FileText,
  Activity, Settings, Zap, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@/hooks/use-dashboard";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/executions", label: "Executions", icon: Play },
  { href: "/logs", label: "Logs", icon: FileText },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: health } = useHealthCheck();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-border bg-sidebar z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 ring-1 ring-primary/30">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-semibold text-sm text-foreground">PyScheduler</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                health?.scheduler === "running" ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              )}
            />
            <span className="text-[10px] text-muted-foreground">
              {health?.scheduler === "running" ? "Scheduler online" : "Scheduler offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.href);
          return (
            <NavLink key={item.href} to={item.href}>
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                whileTap={{ scale: 0.97 }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-accent"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "")} />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Admin</p>
            <p className="text-[10px] text-muted-foreground truncate">admin@scheduler.local</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
