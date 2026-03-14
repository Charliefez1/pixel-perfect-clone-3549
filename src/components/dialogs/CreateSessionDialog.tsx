import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSession } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const sessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or fewer"),
  session_type: z.enum(["meeting", "workshop"]),
  project_id: z.string().optional(),
  session_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date" }).optional().or(z.literal("")),
  duration_minutes: z.string()
    .refine((val) => {
      if (!val) return true;
      const n = Number(val);
      return Number.isInteger(n) && n > 0;
    }, { message: "Duration must be a positive integer" }),
  location: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({ open, onOpenChange }: Props) {
  const { data: projects } = useProjects();
  const createSession = useCreateSession();
  const [sessionType, setSessionType] = useState<"meeting" | "workshop">("meeting");

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      session_type: "meeting",
      project_id: "",
      session_date: "",
      duration_minutes: "60",
      location: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSessionType("meeting");
    }
  }, [open, form]);

  const handleTypeChange = (type: "meeting" | "workshop") => {
    setSessionType(type);
    form.setValue("session_type", type, { shouldValidate: true });
  };

  const onSubmit = async (data: SessionFormData) => {
    try {
      await createSession.mutateAsync({
        title: data.title.trim(),
        project_id: data.project_id || null,
        session_date: data.session_date ? new Date(data.session_date).toISOString() : null,
        duration_minutes: parseInt(data.duration_minutes) || 60,
        location: data.location || null,
        session_type: data.session_type,
      } as any);
      toast.success(`${data.session_type === "workshop" ? "Workshop" : "Meeting"} created`);
      form.reset();
      setSessionType("meeting");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create session");
    }
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New {sessionType === "workshop" ? "Workshop" : "Meeting"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sessionType === "meeting" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => handleTypeChange("meeting")}
              >
                Meeting
              </Button>
              <Button
                type="button"
                variant={sessionType === "workshop" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => handleTypeChange("workshop")}
              >
                Workshop
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              {...form.register("title")}
              placeholder={sessionType === "workshop" ? "e.g. ADHD Awareness Workshop" : "e.g. Prep call with L&D team"}
              autoFocus
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={form.watch("project_id") || ""} onValueChange={(v) => form.setValue("project_id", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="session-date">Date & Time</Label>
              <Input id="session-date" type="datetime-local" {...form.register("session_date")} />
              {errors.session_date && <p className="text-sm text-destructive">{errors.session_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">Duration (min)</Label>
              <Input id="session-duration" type="number" {...form.register("duration_minutes")} />
              {errors.duration_minutes && <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-location">Location</Label>
            <Input id="session-location" {...form.register("location")} placeholder={sessionType === "workshop" ? "e.g. Client Office / Conference Room" : "e.g. Zoom / Teams"} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createSession.isPending || !isValid}>
              {createSession.isPending ? "Creating..." : `Create ${sessionType === "workshop" ? "Workshop" : "Meeting"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
