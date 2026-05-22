import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateJob } from "@/hooks/use-jobs";
import { scriptsApi } from "@/lib/api";
import { toast } from "sonner";

const TIMEZONES = ["UTC", "America/New_York", "America/Los_Angeles", "America/Sao_Paulo", "Europe/London", "Europe/Berlin", "Asia/Tokyo"];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  script_path: z.string().min(1, "Script path is required"),
  schedule_type: z.string().optional(),
  cron_expression: z.string().optional(),
  interval_seconds: z.coerce.number().optional(),
  priority: z.coerce.number().min(1).max(10).default(5),
  timeout: z.coerce.number().min(1).default(300),
  max_retries: z.coerce.number().min(0).max(10).default(0),
  retry_delay: z.coerce.number().min(1).default(60),
  timezone: z.string().default("UTC"),
  is_enabled: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function CreateJobPage() {
  const navigate = useNavigate();
  const createJob = useCreateJob();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 5, timeout: 300, max_retries: 0,
      retry_delay: 60, timezone: "UTC", is_enabled: true,
    },
  });

  const scheduleType = watch("schedule_type");
  const isEnabled = watch("is_enabled");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { filename } = await scriptsApi.upload(file);
      setValue("script_path", filename);
      setUploadedFile(filename);
      toast.success(`"${filename}" uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    await createJob.mutateAsync({
      name: data.name,
      description: data.description,
      category: data.category,
      script_path: data.script_path,
      schedule_type: data.schedule_type as any,
      cron_expression: data.schedule_type === "cron" ? data.cron_expression : undefined,
      interval_seconds: data.schedule_type === "interval" ? data.interval_seconds : undefined,
      priority: data.priority,
      timeout: data.timeout,
      max_retries: data.max_retries,
      retry_delay: data.retry_delay,
      timezone: data.timezone,
      is_enabled: data.is_enabled,
      tags: [],
      env_vars: {},
      script_args: [],
    });
    navigate("/jobs");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Job</h1>
          <p className="text-sm text-muted-foreground">Configure a new Python script job</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Job Name *</Label>
              <Input id="name" placeholder="My Python Job" {...register("name")} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="What does this job do?" rows={2} {...register("description")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="e.g. Data, Reports" {...register("category")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="script_path">Script Path *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="script_path"
                    placeholder="hello_world.py"
                    {...register("script_path")}
                    className={uploadedFile ? "pr-8" : ""}
                  />
                  {uploadedFile && (
                    <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".py"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload .py file"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
              {errors.script_path && <p className="text-xs text-red-400">{errors.script_path.message}</p>}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Schedule</h2>

          <div className="space-y-1.5">
            <Label>Schedule Type</Label>
            <Select onValueChange={(v) => setValue("schedule_type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule type (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cron">Cron Expression</SelectItem>
                <SelectItem value="interval">Interval</SelectItem>
                <SelectItem value="daily">Daily (midnight)</SelectItem>
                <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                <SelectItem value="monthly">Monthly (1st)</SelectItem>
                <SelectItem value="once">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scheduleType === "cron" && (
            <div className="space-y-1.5">
              <Label htmlFor="cron_expression">Cron Expression</Label>
              <Input id="cron_expression" placeholder="*/5 * * * *" {...register("cron_expression")} className="font-mono" />
              <p className="text-xs text-muted-foreground">Format: minute hour day month weekday</p>
            </div>
          )}

          {scheduleType === "interval" && (
            <div className="space-y-1.5">
              <Label htmlFor="interval_seconds">Interval (seconds)</Label>
              <Input id="interval_seconds" type="number" placeholder="300" {...register("interval_seconds")} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select defaultValue="UTC" onValueChange={(v) => setValue("timezone", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Execution Settings */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Execution Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input id="timeout" type="number" {...register("timeout")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input id="priority" type="number" min={1} max={10} {...register("priority")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_retries">Max Retries</Label>
              <Input id="max_retries" type="number" min={0} max={10} {...register("max_retries")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="retry_delay">Retry Delay (seconds)</Label>
              <Input id="retry_delay" type="number" {...register("retry_delay")} />
            </div>
          </div>
        </div>

        {/* Enable Toggle + Submit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={isEnabled}
              onCheckedChange={(v) => setValue("is_enabled", v)}
            />
            <span className="text-sm">{isEnabled ? "Enabled — will schedule immediately" : "Disabled — won't run automatically"}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>Cancel</Button>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
