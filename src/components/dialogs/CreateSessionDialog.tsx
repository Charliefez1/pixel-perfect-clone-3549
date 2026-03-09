import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSession } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState<"meeting" | "workshop">("meeting");
  const [projectId, setProjectId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const { data: projects } = useProjects();
  const createSession = useCreateSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createSession.mutateAsync({
        title: title.trim(),
        project_id: projectId || null,
        session_date: sessionDate ? new Date(sessionDate).toISOString() : null,
        duration_minutes: parseInt(duration) || 60,
        location: location || null,
        session_type: sessionType,
      } as any);
      toast.success(`${sessionType === "workshop" ? "Workshop" : "Meeting"} created`);
      setTitle(""); setProjectId(""); setSessionDate(""); setDuration("60"); setLocation(""); setSessionType("meeting");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create session");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New {sessionType === "workshop" ? "Workshop" : "Meeting"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sessionType === "meeting" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSessionType("meeting")}
              >
                Meeting
              </Button>
              <Button
                type="button"
                variant={sessionType === "workshop" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSessionType("workshop")}
              >
                Workshop
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={sessionType === "workshop" ? "e.g. ADHD Awareness Workshop" : "e.g. Prep call with L&D team"}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
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
              <Input id="session-date" type="datetime-local" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">Duration (min)</Label>
              <Input id="session-duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-location">Location</Label>
            <Input id="session-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={sessionType === "workshop" ? "e.g. Client Office / Conference Room" : "e.g. Zoom / Teams"} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createSession.isPending || !title.trim()}>
              {createSession.isPending ? "Creating…" : `Create ${sessionType === "workshop" ? "Workshop" : "Meeting"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
