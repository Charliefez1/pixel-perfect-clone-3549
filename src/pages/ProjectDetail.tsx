import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject, useProjects, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useSessions } from "@/hooks/useSessions";
import { useInvoices } from "@/hooks/useInvoices";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";
import { useProjectUpdates, useCreateProjectUpdate } from "@/hooks/useProjectUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { MilestonesTab } from "@/components/projects/MilestonesTab";
import { SessionsTab } from "@/components/projects/SessionsTab";
import { DeliveriesTab } from "@/components/projects/DeliveriesTab";
import { DocumentsTab } from "@/components/projects/DocumentsTab";
import { ActivityTab } from "@/components/projects/ActivityTab";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckSquare,
  Package,
  Target,
  Pencil,
  Trash2,
  Plus,
  Sparkles,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { isPast } from "date-fns";
import ReactMarkdown from "react-markdown";

const neuroPhases = ["N", "E", "U", "R", "O"] as const;
const phaseNames = ["needs", "engage", "understand", "redesign", "optimise"];
const phaseLabels: Record<string, string> = { N: "Needs", E: "Engage", U: "Understand", R: "Redesign", O: "Optimise" };
const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, redesign: 3, optimise: 4 };
const statusStyles: Record<string, string> = {
  setup: "bg-muted text-muted-foreground",
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  paused: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  completed: "bg-primary/20 text-primary",
};

const stageLabels: Record<string, string> = {
  contract_signing: "Contract Signing",
  onboarding: "Onboarding",
  planning: "Planning",
  data_gathering: "Data Gathering",
  content_build: "Content Build",
  delivery: "Delivery",
  analysis_feedback: "Analysis & Feedback",
  closing: "Closing",
};

const taskStatusColors: Record<string, string> = {
  done: "bg-green-500",
  in_progress: "bg-blue-500",
  blocked: "bg-red-500",
  todo: "bg-muted-foreground",
};

function suggestPhaseTransition(
  neuroPhase: string,
  tasks: any[] | undefined,
  deliveries: any[] | undefined,
  sessions: any[] | undefined
) {
  if (neuroPhase === "needs") {
    if (sessions?.some((s) => s.session_date)) return "engage";
  }
  if (neuroPhase === "engage") {
    const prepTasks = tasks?.filter((t) => t.title?.toLowerCase().includes("prep"));
    if (prepTasks?.length && prepTasks.every((t) => t.status === "done")) return "understand";
  }
  if (neuroPhase === "understand") {
    if (deliveries?.some((d) => d.status === "in_progress")) return "redesign";
  }
  if (neuroPhase === "redesign") {
    if (deliveries?.length && deliveries.every((d) => d.status === "delivered")) return "optimise";
  }
  return null;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const { data: allTasks } = useTasks();
  const { data: allDeliveries } = useDeliveries();
  const { data: allSessions } = useSessions();
  const { data: allProjects } = useProjects();
  const { data: allInvoices } = useInvoices();
  const { data: milestones } = useProjectMilestones(id);
  const { data: updates } = useProjectUpdates(id);
  const createUpdate = useCreateProjectUpdate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [taskView, setTaskView] = useState<"list" | "board">("list");
  const [newUpdateOpen, setNewUpdateOpen] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [generatingUpdate, setGeneratingUpdate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Project not found.</p>
          <Button variant="outline" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const projectTasks = allTasks?.filter((t) => t.project_id === id) || [];
  const projectDeliveries = allDeliveries?.filter((d) => d.project_id === id) || [];
  const projectSessions = allSessions?.filter((s) => s.project_id === id) || [];
  const projectInvoices = allInvoices?.filter((i) => i.project_id === id || (project.deal_id && i.deal_id === project.deal_id)) || [];
  const siblingProjects = project.organisation_id
    ? allProjects?.filter((p) => p.organisation_id === project.organisation_id && p.id !== id) || []
    : [];
  const phaseIndex = phaseToIndex[project.neuro_phase || "needs"] || 0;
  const completedTasks = projectTasks.filter((t) => t.status === "done").length;
  const totalTasks = projectTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = projectTasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done");
  const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress");
  const blockedTasks = projectTasks.filter((t) => t.status === "blocked");
  const todoTasks = projectTasks.filter((t) => t.status === "todo");
  const upcomingDeliveries = projectDeliveries.filter((d) => d.delivery_date && new Date(d.delivery_date) >= new Date());
  const completedMilestones = milestones?.filter((m) => m.completed_at).length || 0;
  const totalMilestones = milestones?.length || 0;

  // Billing calculations
  const totalBilled = projectInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const paidInvoices = projectInvoices.filter((i) => i.status === "paid");
  const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const overdueInvoices = projectInvoices.filter((i) => i.status === "overdue" || (i.status === "sent" && i.due_date && isPast(new Date(i.due_date))));
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const outstandingInvoices = projectInvoices.filter((i) => i.status !== "paid");
  const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const budgetUsedPct = project.budget ? Math.round((totalBilled / project.budget) * 100) : 0;

  const suggestedPhase = suggestPhaseTransition(
    project.neuro_phase || "needs",
    projectTasks,
    projectDeliveries,
    projectSessions
  );

  const startEditing = () => {
    setEditValues({
      name: project.name,
      status: project.status,
      stage: project.stage || "contract_signing",
      neuro_phase: project.neuro_phase || "needs",
      budget: project.budget?.toString() || "0",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      description: project.description || "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    updateProject.mutate(
      {
        id: project.id,
        name: editValues.name,
        status: editValues.status as any,
        stage: editValues.stage as any,
        neuro_phase: editValues.neuro_phase as any,
        budget: parseFloat(editValues.budget) || 0,
        start_date: editValues.start_date || null,
        end_date: editValues.end_date || null,
        description: editValues.description || null,
      },
      {
        onSuccess: () => {
          toast.success("Project updated");
          setEditing(false);
        },
      }
    );
  };

  const handlePhaseClick = (index: number) => {
    updateProject.mutate(
      { id: project.id, neuro_phase: phaseNames[index] as any },
      { onSuccess: () => toast.success(`Phase updated to ${phaseLabels[neuroPhases[index]]}`) }
    );
  };

  const handleSaveUpdate = () => {
    if (!updateBody.trim()) return;
    createUpdate.mutate(
      { project_id: project.id, title: updateTitle || undefined, body: updateBody },
      {
        onSuccess: () => {
          toast.success("Update posted");
          setNewUpdateOpen(false);
          setUpdateTitle("");
          setUpdateBody("");
        },
      }
    );
  };

  const generateUpdate = async () => {
    setGeneratingUpdate(true);
    try {
      const context = {
        project: { name: project.name, status: project.status, neuro_phase: project.neuro_phase },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          in_progress: inProgressTasks.length,
          overdue: overdueTasks.length,
          blocked: blockedTasks.length,
        },
        deliveries: {
          total: projectDeliveries.length,
          upcoming: upcomingDeliveries.length,
          completed: projectDeliveries.filter((d) => d.status === "delivered").length,
        },
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
        },
      };

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a concise project status update for "${project.name}". Include:
- Overall status (on track / at risk / behind)
- Key achievements since last update
- Upcoming activities in next 2 weeks
- Any blockers or risks
- Next steps

Tone: professional, warm, clear. British English.
Format as markdown with headers.
Keep it to 150-200 words.

Project context: ${JSON.stringify(context)}`,
            },
          ],
          agent: "pm",
          context,
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate update");

      let text = "";
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) text += content;
            } catch {}
          }
        }
      }

      setUpdateTitle(`Status Update — ${new Date().toLocaleDateString("en-GB")}`);
      setUpdateBody(text);
      setNewUpdateOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate update");
    } finally {
      setGeneratingUpdate(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{project.name}</h1>
              <Badge className={statusStyles[project.status]}>{project.status}</Badge>
              {project.stage && (
                <Badge variant="outline" className="text-[10px]">
                  {stageLabels[project.stage] || project.stage}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {project.organisation_id ? (
                <button
                  onClick={() => navigate(`/clients/${project.organisation_id}`)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {project.organisations?.name || "View Client"}
                </button>
              ) : (
                <span>No organisation</span>
              )}
              {project.budget ? <span> · £{project.budget.toLocaleString()}</span> : null}
              {project.service_type && <span> · <span className="capitalize">{project.service_type}</span></span>}
            </div>
            {/* Budget progress bar */}
            {project.budget ? (
              <div className="flex items-center gap-2 mt-1 max-w-xs">
                <Progress value={budgetUsedPct} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground">{budgetUsedPct}% billed</span>
              </div>
            ) : null}
            {/* Sibling projects */}
            {siblingProjects.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <span className="text-[10px] text-muted-foreground">Also:</span>
                {siblingProjects.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => navigate(`/projects/${sp.id}`)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/deliveries`)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Delivery
            </Button>
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* NEURO Phase indicator */}
        <div className="flex gap-1 mt-4 max-w-md">
          {neuroPhases.map((letter, i) => (
            <button
              key={letter}
              onClick={() => handlePhaseClick(i)}
              className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                i <= phaseIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              title={phaseLabels[letter]}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Phase suggestion banner */}
        {suggestedPhase && (
          <div className="mt-3 flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm flex-1">
              This project looks ready to move to the <span className="font-semibold capitalize">{suggestedPhase}</span> phase.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateProject.mutate(
                  { id: project.id, neuro_phase: suggestedPhase as any },
                  { onSuccess: () => toast.success(`Phase updated to ${suggestedPhase}`) }
                )
              }
            >
              Move to {suggestedPhase.charAt(0).toUpperCase() + suggestedPhase.slice(1)}
            </Button>
          </div>
        )}
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="max-w-2xl space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={editValues.name || ""} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="h-9" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={editValues.status} onValueChange={(v) => setEditValues({ ...editValues, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["setup", "active", "paused", "completed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Stage</label>
                <Select value={editValues.stage || "contract_signing"} onValueChange={(v) => setEditValues({ ...editValues, stage: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Budget (£)</label>
                <Input value={editValues.budget || ""} onChange={(e) => setEditValues({ ...editValues, budget: e.target.value })} className="h-9" type="number" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <Input type="date" value={editValues.start_date || ""} onChange={(e) => setEditValues({ ...editValues, start_date: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End Date</label>
                <Input type="date" value={editValues.end_date || ""} onChange={(e) => setEditValues({ ...editValues, end_date: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea value={editValues.description || ""} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateProject.isPending}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          {/* Overview Tab — Two-column layout */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left column — 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick stats row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <CheckSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                        <p className="text-xs text-muted-foreground">Tasks done</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{upcomingDeliveries.length}</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueTasks.length > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{overdueTasks.length}</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedMilestones}/{totalMilestones}</p>
                        <p className="text-xs text-muted-foreground">Milestones</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress ring */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeDasharray={`${completionRate * 2.51} 251`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{completionRate}%</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p><span className="font-semibold">{completedTasks}</span> completed</p>
                        <p className="text-muted-foreground">{inProgressTasks.length} in progress</p>
                        <p className="text-muted-foreground">{blockedTasks.length} blocked</p>
                        <p className="text-muted-foreground">{todoTasks.length} to do</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* NEURO Phase Timeline */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">NEURO Phase Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {neuroPhases.map((letter, i) => (
                        <div key={letter} className="flex-1 space-y-1">
                          <div
                            className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                              i <= phaseIndex
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            } ${i === phaseIndex ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          >
                            {phaseLabels[letter]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Activity feed */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityTab organisationId={project.organisation_id} />
                  </CardContent>
                </Card>
              </div>

              {/* Right column — properties sidebar */}
              <div className="space-y-4">
                {/* Properties card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={statusStyles[project.status]}>{project.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stage</span>
                      <span className="font-medium">{stageLabels[project.stage || "contract_signing"] || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">NEURO Phase</span>
                      <span className="font-medium capitalize">{project.neuro_phase || "needs"}</span>
                    </div>
                    {project.service_type && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Service Type</span>
                        <span className="font-medium capitalize">{project.service_type}</span>
                      </div>
                    )}
                    {project.start_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Start Date</span>
                        <span className="font-medium">{new Date(project.start_date).toLocaleDateString("en-GB")}</span>
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="font-medium">{new Date(project.end_date).toLocaleDateString("en-GB")}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financials card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Financials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-semibold">£{(project.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Billed</span>
                      <span className="font-medium">£{totalBilled.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-medium text-[hsl(142,71%,45%)]">£{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className={`font-medium ${outstandingAmount > 0 ? "text-amber-500" : ""}`}>
                        £{outstandingAmount.toLocaleString()}
                      </span>
                    </div>
                    {overdueAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overdue</span>
                        <span className="font-medium text-destructive">£{overdueAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {project.budget ? (
                      <div className="pt-1">
                        <Progress value={budgetUsedPct} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          £{(project.budget - totalBilled).toLocaleString()} remaining
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Description */}
                {project.description && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Milestones snapshot */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MilestonesTab projectId={project.id} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                <button
                  onClick={() => setTaskView("list")}
                  className={`px-3 py-1.5 transition-colors ${taskView === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  List
                </button>
                <button
                  onClick={() => setTaskView("board")}
                  className={`px-3 py-1.5 transition-colors ${taskView === "board" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  Board
                </button>
              </div>
            </div>

            {totalTasks > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completedTasks}/{totalTasks} complete</span>
                </div>
                <Progress value={(completedTasks / totalTasks) * 100} className="h-1.5" />
              </div>
            )}

            {taskView === "list" ? (
              <div className="space-y-1.5">
                {!projectTasks.length ? (
                  <p className="text-sm text-muted-foreground py-4">No tasks yet.</p>
                ) : (
                  projectTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-md border text-sm">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${taskStatusColors[t.status] || "bg-muted-foreground"}`} />
                      <span className={`flex-1 truncate ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                      <Badge variant="secondary" className="text-[9px] capitalize">{t.priority}</Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">{t.status.replace("_", " ")}</Badge>
                      {t.due_date && (
                        <span className={`text-[10px] ${isPast(new Date(t.due_date)) && t.status !== "done" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {new Date(t.due_date).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <TaskBoard tasks={projectTasks} />
            )}
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries">
            <DeliveriesTab projectId={project.id} dealId={project.deal_id} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Billing stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={`text-2xl font-bold ${outstandingAmount > 0 ? "text-amber-500" : ""}`}>
                    £{outstandingAmount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className={`text-2xl font-bold ${overdueAmount > 0 ? "text-destructive" : ""}`}>
                    £{overdueAmount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-[hsl(142,71%,45%)]">£{totalPaid.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Billed</p>
                  <p className="text-2xl font-bold">£{totalBilled.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget bar */}
            {project.budget ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">£{totalBilled.toLocaleString()} billed of £{(project.budget || 0).toLocaleString()}</span>
                    <span className="font-medium">{budgetUsedPct}%</span>
                  </div>
                  <Progress value={budgetUsedPct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    £{(project.budget - totalBilled).toLocaleString()} remaining
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Invoices list */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Invoices ({projectInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No invoices linked to this project.</p>
                ) : (
                  <div className="space-y-2">
                    {projectInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-md border">
                        <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString("en-GB") : "—"}
                            {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString("en-GB")}`}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">£{(inv.total || 0).toLocaleString()}</span>
                        <Badge variant="secondary" className="capitalize text-[9px]">{inv.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <SessionsTab projectId={project.id} />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <DocumentsTab projectId={project.id} dealId={project.deal_id} />
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setNewUpdateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New Update
              </Button>
              <Button size="sm" variant="outline" onClick={generateUpdate} disabled={generatingUpdate}>
                <Sparkles className="h-4 w-4 mr-1" />
                {generatingUpdate ? "Generating..." : "Generate Update"}
              </Button>
            </div>

            {newUpdateOpen && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="Update title (optional)"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    className="h-9"
                  />
                  <Textarea
                    placeholder="Write your update (markdown supported)..."
                    value={updateBody}
                    onChange={(e) => setUpdateBody(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveUpdate} disabled={createUpdate.isPending || !updateBody.trim()}>
                      Post Update
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setNewUpdateOpen(false); setUpdateTitle(""); setUpdateBody(""); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!updates?.length && !newUpdateOpen ? (
              <p className="text-sm text-muted-foreground py-4">No updates yet. Post your first update or generate one with AI.</p>
            ) : (
              <div className="space-y-4">
                {updates?.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        {u.title && <p className="font-medium text-sm">{u.title}</p>}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                        <ReactMarkdown>{u.body}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={project.name}
        onConfirm={() =>
          deleteProject.mutate(project.id, {
            onSuccess: () => {
              toast.success("Project deleted");
              navigate("/projects");
            },
            onError: (e) => toast.error(e.message),
          })
        }
        loading={deleteProject.isPending}
      />
    </div>
  );
}

function TaskBoard({ tasks }: { tasks: any[] }) {
  const updateTask = useUpdateTask();
  const columns = [
    { key: "todo", label: "To Do", color: "bg-muted-foreground" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-500" },
    { key: "blocked", label: "Blocked", color: "bg-red-500" },
    { key: "done", label: "Done", color: "bg-green-500" },
  ];

  const moveTask = (taskId: string, newStatus: string) => {
    updateTask.mutate({ id: taskId, status: newStatus as any });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-sm font-medium">{col.label}</span>
              <Badge variant="secondary" className="text-[10px] ml-auto">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {colTasks.map((t) => (
                <Card key={t.id} className="cursor-default">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium">{t.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[9px] capitalize">{t.priority}</Badge>
                      {t.due_date && (
                        <span className={`text-[10px] ${isPast(new Date(t.due_date)) && t.status !== "done" ? "text-destructive" : "text-muted-foreground"}`}>
                          {new Date(t.due_date).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1 flex-wrap">
                      {columns
                        .filter((c) => c.key !== col.key)
                        .map((c) => (
                          <button
                            key={c.key}
                            onClick={() => moveTask(t.id, c.key)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {c.label}
                          </button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
