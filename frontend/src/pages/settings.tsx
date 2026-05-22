import { Settings, User, Shield, Bell, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and system preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Profile
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input defaultValue={user?.full_name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue={user?.email ?? ""} disabled />
          </div>
        </div>
        <Button size="sm" variant="outline">Save Changes</Button>
      </div>

      {/* Execution Defaults */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Execution Defaults
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Default Timeout (seconds)</Label>
            <Input type="number" defaultValue={300} />
          </div>
          <div className="space-y-1.5">
            <Label>Max Concurrent Executions</Label>
            <Input type="number" defaultValue={5} disabled />
            <p className="text-xs text-muted-foreground">Set via environment variable</p>
          </div>
        </div>
      </div>

      {/* System */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          System Information
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Version", "1.0.0"],
            ["Runtime", "FastAPI + APScheduler"],
            ["Database", "PostgreSQL 16"],
            ["Python", "3.11"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col border-b border-border/50 pb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-mono text-xs font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications placeholder */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          Notifications
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground ml-auto">Coming soon</span>
        </h2>
        <div className="space-y-3 opacity-50 pointer-events-none">
          {["Email on failure", "Email on success", "Slack notifications"].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <Label className="cursor-pointer">{item}</Label>
              <Switch disabled />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
