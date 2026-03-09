import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Video, Pencil, Trash2, Loader2 } from "lucide-react";
import { useSessions, useUpdateSession, useDeleteSession, Session } from "@/hooks/useSessions";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { EmptyState } from "@/components/layout/EmptyState";
import { useDialogs } from "@/App";
import { toast } from "sonner";

export default function Meetings() {
  const { data: sessions, isLoading } = useSessions();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const { data: projects } = useProjects();
  const [selected, setSelected] = useState<Session | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "meeting" | "workshop">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { openCreateSession } = useDialogs();

  // Edit fields
  const [eTitle, setETitle] = useState("");
  const [eType, setEType] = useState("meeting");
  const [eProjectId, setEProjectId] = useState("");
  const [eDate, setEDate] = useState("");
  const [eDuration, setEDuration] = useState("");
  const [eLocation, setELocation] = useState("");
  const [eNotes, setENotes] = useState("");

  const startEdit = () => {
    if (!selected) return;
    setETitle(selected.title);
    setEType(selected.session_type || "meeting");
    setEProjectId(selected.project_id || "");
    setEDate(selected.session_date ? selected.session_date.slice(0, 16) : "");
    setEDuration(String(selected.duration_minutes || 60));
    setELocation(selected.location || "");
    setENotes(selected.notes || "");
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selected || !eTitle.trim()) return;
    updateSession.mutate(
      { id: selected.id, title: eTitle, session_type: eType, project_id: eProjectId || null, session_date: eDate || null, duration_minutes: parseInt(eDuration) || 60, location: eLocation || null, notes: eNotes || null },
      { onSuccess: () => { toast.success("Session updated"); setEditing(false); setSelected(null); } }
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteSession.mutate(selected.id, { onSuccess: () => { toast.success("Session deleted"); setDeleteOpen(false); setSelected(null); } });
  };

  const filtered = sessions?.filter((s) => {
    if (typeFilter !== "all" && s.session_type !== typeFilter) return false;
    if (search) {
      return s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.projects?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.location?.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const renderSessionCard = (s: Session) => {
    const sessionDate = s.session_date ? parseISO(s.session_date) : null;
    const isOnline = s.location?.toLowerCase().includes("zoom") ||
                     s.location?.toLowerCase().includes("teams") ||
                     s.location?.toLowerCase().includes("online");
    const isWorkshop = s.session_type === "workshop";

    return (
      <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelected(s); setEditing(false); }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {sessionDate && (
                <div className="text-center shrink-0 w-14 py-2 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">{format(sessionDate, "MMM")}</p>
                  <p className="text-xl font-bold text-primary">{format(sessionDate, "d")}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">
                  {s.projects?.organisations?.name || s.projects?.name || "No project"}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {sessionDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(sessionDate, "h:mm a")} ({s.duration_minutes || 60} min)
                    </span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1">
                      {isOnline ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                      {s.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isWorkshop ? "default" : "secondary"}>
                {isWorkshop ? "workshop" : "meeting"}
              </Badge>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {s.facilitator_id ? "F" : "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="Sessions & Meetings" searchPlaceholder="Search sessions..." actionLabel="New Session" onAction={openCreateSession} onSearch={setSearch} />
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="meeting">Meetings</TabsTrigger>
            <TabsTrigger value="workshop">Workshops</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4 max-w-4xl">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !filtered?.length ? (
          <EmptyState icon={Clock} title="No sessions found" description="Schedule your first session or meeting." action={{ label: "New Session", onClick: openCreateSession }} />
        ) : (
          <div className="space-y-4 max-w-4xl">
            {filtered.map(renderSessionCard)}
          </div>
        )}
      </div>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => { setSelected(null); setEditing(false); }}
          title={editing ? eTitle : selected.title}
          fields={editing ? [] : [
            { label: "Type", value: selected.session_type === "workshop" ? "Workshop" : "Meeting" },
            { label: "Project", value: selected.projects?.name },
            { label: "Organisation", value: selected.projects?.organisations?.name },
            { label: "Date", value: selected.session_date ? format(parseISO(selected.session_date), "PPP 'at' p") : undefined },
            { label: "Duration", value: `${selected.duration_minutes || 60} minutes` },
            { label: "Location", value: selected.location },
            { label: "Notes", value: selected.notes },
          ]}
        >
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={eTitle} onChange={e => setETitle(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label><Select value={eType} onValueChange={setEType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="workshop">Workshop</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Project</Label><Select value={eProjectId} onValueChange={setEProjectId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date & Time</Label><Input type="datetime-local" value={eDate} onChange={e => setEDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={eDuration} onChange={e => setEDuration(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Location</Label><Input value={eLocation} onChange={e => setELocation(e.target.value)} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={eNotes} onChange={e => setENotes(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateSession.isPending}>{updateSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={startEdit}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
            </div>
          )}
        </DetailPanel>
      )}

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="session" onConfirm={handleDelete} loading={deleteSession.isPending} />
    </>
  );
}
