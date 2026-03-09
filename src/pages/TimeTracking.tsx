import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimeEntries, useCreateTimeEntry, useDeleteTimeEntry, TimeEntry } from "@/hooks/useTimeEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { format } from "date-fns";
import { toast } from "sonner";
import { Clock, Play, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimeTracking() {
  const { data: entries, isLoading } = useTimeEntries();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const createEntry = useCreateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<TimeEntry | null>(null);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerDesc, setTimerDesc] = useState("");

  // Manual entry form
  const [formProject, setFormProject] = useState("");
  const [formTask, setFormTask] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formHours, setFormHours] = useState("");
  const [formMinutes, setFormMinutes] = useState("");
  const [formBillable, setFormBillable] = useState(true);

  // Timer interval
  useState(() => {
    const interval = setInterval(() => {
      if (timerStart) {
        setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  });

  const startTimer = () => {
    setTimerStart(Date.now());
    setTimerRunning(true);
    setTimerElapsed(0);
  };

  const stopTimer = () => {
    if (!timerStart) return;
    const minutes = Math.max(1, Math.round((Date.now() - timerStart) / 60000));
    createEntry.mutate(
      {
        project_id: timerProject || null,
        description: timerDesc || "Timer entry",
        duration_minutes: minutes,
        date: new Date().toISOString().split("T")[0],
        billable: true,
      },
      {
        onSuccess: () => {
          toast.success(`Logged ${minutes} minutes`);
          setTimerRunning(false);
          setTimerStart(null);
          setTimerElapsed(0);
          setTimerDesc("");
          setTimerProject("");
        },
      }
    );
  };

  const handleManualSubmit = () => {
    const duration = (parseInt(formHours || "0") * 60) + parseInt(formMinutes || "0");
    if (duration <= 0) { toast.error("Duration must be greater than 0"); return; }
    createEntry.mutate(
      {
        project_id: formProject || null,
        task_id: formTask || null,
        description: formDesc,
        date: formDate,
        duration_minutes: duration,
        billable: formBillable,
      },
      {
        onSuccess: () => {
          toast.success("Time entry logged");
          setDialogOpen(false);
          setFormProject(""); setFormTask(""); setFormDesc(""); setFormHours(""); setFormMinutes("");
        },
      }
    );
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalToday = entries?.filter(e => e.date === new Date().toISOString().split("T")[0]).reduce((s, e) => s + e.duration_minutes, 0) || 0;
  const totalWeek = entries?.reduce((s, e) => {
    const d = new Date(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo ? s + e.duration_minutes : s;
  }, 0) || 0;
  const billableTotal = entries?.filter(e => e.billable).reduce((s, e) => s + e.duration_minutes, 0) || 0;
  const totalAll = entries?.reduce((s, e) => s + e.duration_minutes, 0) || 1;

  return (
    <>
      <PageHeader title="Time Tracking" searchPlaceholder="Search entries..." actionLabel="Log Time" onAction={() => setDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Timer bar */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <Input
              placeholder="What are you working on?"
              value={timerDesc}
              onChange={(e) => setTimerDesc(e.target.value)}
              className="flex-1"
              disabled={timerRunning}
            />
            <Select value={timerProject} onValueChange={setTimerProject} disabled={timerRunning}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className={cn("font-mono text-lg tabular-nums min-w-[100px] text-center", timerRunning && "text-primary font-bold")}>
              {formatTimer(timerElapsed)}
            </span>
            {timerRunning ? (
              <Button variant="destructive" size="icon" onClick={stopTimer}><Square className="h-4 w-4" /></Button>
            ) : (
              <Button size="icon" onClick={startTimer}><Play className="h-4 w-4" /></Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Today</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{formatDuration(totalToday)}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">This Week</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{formatDuration(totalWeek)}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Billable %</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{Math.round((billableTotal / totalAll) * 100)}%</p>}</CardContent></Card>
        </div>

        {/* Entries table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !entries?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No time entries yet. Start the timer or log time manually.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
                      <TableCell className="pl-6 text-sm">{format(new Date(e.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-sm font-medium">{e.description || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.projects?.name || "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{formatDuration(e.duration_minutes)}</TableCell>
                      <TableCell>{e.billable ? <Badge className="bg-primary/10 text-primary">Billable</Badge> : <Badge variant="secondary">Non-billable</Badge>}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(ev) => { ev.stopPropagation(); deleteEntry.mutate(e.id, { onSuccess: () => toast.success("Deleted") }); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual entry dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Time Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Description</Label><Input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="What did you work on?" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formProject} onValueChange={setFormProject}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Task</Label>
                <Select value={formTask} onValueChange={setFormTask}>
                  <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                  <SelectContent>{tasks?.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Hours</Label><Input type="number" min="0" value={formHours} onChange={e => setFormHours(e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label>Minutes</Label><Input type="number" min="0" max="59" value={formMinutes} onChange={e => setFormMinutes(e.target.value)} placeholder="0" /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleManualSubmit} disabled={createEntry.isPending}>{createEntry.isPending ? "Saving..." : "Log Entry"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.description || "Time Entry"}
          fields={[
            { label: "Date", value: format(new Date(selected.date), "dd/MM/yyyy") },
            { label: "Duration", value: formatDuration(selected.duration_minutes) },
            { label: "Project", value: selected.projects?.name },
            { label: "Task", value: selected.tasks?.title },
            { label: "Billable", value: selected.billable ? "Yes" : "No" },
          ]}
        />
      )}
    </>
  );
}
