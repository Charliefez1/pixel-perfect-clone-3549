import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProjects, Project, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useDeals } from "@/hooks/useDeals";
import { useSessions } from "@/hooks/useSessions";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProjectMilestones } from "@/hooks/useProjectMilestones";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDialogs } from "@/App";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { MilestonesTab } from "@/components/projects/MilestonesTab";
import { SessionsTab } from "@/components/projects/SessionsTab";
import { DeliveriesTab } from "@/components/projects/DeliveriesTab";
import { DocumentsTab } from "@/components/projects/DocumentsTab";
import { ActivityTab } from "@/components/projects/ActivityTab";
import { AlertTriangle, CalendarDays, CheckCircle2, Upload } from "lucide-react";
import { CSVImportDialog, CSVColumn } from "@/components/dialogs/CSVImportDialog";
import { useQueryClient } from "@tanstack/react-query";

const projectCSVColumns: CSVColumn[] = [
  { key: "name", label: "Name", required: true },
  { key: "status", label: "Status" },
  { key: "budget", label: "Budget" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "description", label: "Description" },
];

const neuroPhases = ["N", "E", "U", "R", "O"] as const;
const phaseLabels: Record<string, string> = { N: "Needs", E: "Engage", U: "Understand", R: "Realise", O: "Ongoing" };
const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, realise: 3, ongoing: 4 };
const statusStyles: Record<string, string> = {
  setup: "bg-muted text-muted-foreground",
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  paused: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  completed: "bg-primary/20 text-primary",
};

const packageColors: Record<string, string> = {
  small: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  large: "bg-purple-100 text-purple-700",
};

type FilterMode = "all" | "needs_action";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { data: tasks } = useTasks();
  const { data: sessions } = useSessions();
  const { data: deliveries } = useDeliveries();
  const { data: allMilestones } = useAllProjectMilestones();
  const [view, setView] = useState<ViewMode>("board");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const { openCreateProject } = useDialogs();
  const queryClient = useQueryClient();

  const now = new Date();

  function getProjectSummary(p: Project) {
    const pMilestones = allMilestones?.filter((m) => m.project_id === p.id) || [];
    const nextMilestone = pMilestones.find((m) => !m.completed_at);
    const completedMilestones = pMilestones.filter((m) => m.completed_at).length;

    const pTasks = tasks?.filter((t) => t.project_id === p.id) || [];
    const overdueTasks = pTasks.filter((t) => t.status !== "done" && t.due_date && new Date(t.due_date) < now).length;

    const pSessions = sessions?.filter((s) => s.project_id === p.id && s.session_date && new Date(s.session_date) >= now) || [];
    pSessions.sort((a, b) => new Date(a.session_date!).getTime() - new Date(b.session_date!).getTime());
    const nextSession = pSessions[0];

    const pDeliveries = deliveries?.filter((d) => p.deal_id && d.deal_id === p.deal_id && d.delivery_date && new Date(d.delivery_date) >= now) || [];
    pDeliveries.sort((a, b) => new Date(a.delivery_date!).getTime() - new Date(b.delivery_date!).getTime());
    const nextDelivery = pDeliveries[0];
    const daysToDelivery = nextDelivery ? Math.ceil((new Date(nextDelivery.delivery_date!).getTime() - now.getTime()) / 86400000) : null;

    const needsAction =
      overdueTasks > 0 ||
      (nextSession && (new Date(nextSession.session_date!).getTime() - now.getTime()) < 7 * 86400000) ||
      (daysToDelivery !== null && daysToDelivery <= 7);

    return { nextMilestone, completedMilestones, totalMilestones: pMilestones.length, overdueTasks, nextSession, nextDelivery, daysToDelivery, needsAction };
  }

  const filteredProjects = projects?.filter((p) => {
    if (filter === "all") return true;
    if (p.status === "completed") return false;
    return getProjectSummary(p).needsAction;
  });

  return (
    <>
      <PageHeader title="Projects" searchPlaceholder="Search projects..." actionLabel="New Project" onAction={openCreateProject}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              All Projects
            </button>
            <button
              onClick={() => setFilter("needs_action")}
              className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 ${filter === "needs_action" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <AlertTriangle className="h-3 w-3" />
              Needs Action
            </button>
          </div>
          <ViewToggle value={view} onChange={setView} options={["board", "list", "table"]} />
        </div>
      </PageHeader>
      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Projects"
        tableName="projects"
        columns={projectCSVColumns}
        transformRow={(row) => ({
          ...row,
          budget: row.budget ? parseFloat(row.budget) || 0 : 0,
          status: row.status || "setup",
          start_date: row.start_date || null,
          end_date: row.end_date || null,
        })}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
      />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
        ) : !filteredProjects?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>{filter === "needs_action" ? "Nothing needs your attention right now 🎉" : "No projects yet. Create your first project to get started."}</p>
          </div>
        ) : view === "board" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((p) => {
              const summary = getProjectSummary(p);
              const phaseIndex = phaseToIndex[p.neuro_phase || "needs"] || 0;
              return (
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.organisations?.name || "No organisation"}</p>
                      </div>
                      <Badge className={statusStyles[p.status]}>{p.status}</Badge>
                    </div>

                    {/* NEURO phase mini bar */}
                    <div className="flex gap-0.5">
                      {neuroPhases.map((letter, i) => (
                        <div key={letter} className={`flex-1 h-1.5 rounded-full ${i <= phaseIndex ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>

                    {/* Milestone progress */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{summary.completedMilestones}/{summary.totalMilestones} milestones</span>
                      </div>
                      {summary.nextMilestone && (
                        <span className="text-primary font-medium truncate max-w-[50%]">Next: {summary.nextMilestone.label}</span>
                      )}
                    </div>

                    {/* Action indicators */}
                    <div className="flex flex-wrap gap-1.5">
                      {summary.overdueTasks > 0 && (
                        <Badge variant="destructive" className="text-[9px]">
                          {summary.overdueTasks} overdue task{summary.overdueTasks > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {summary.nextSession && (
                        <Badge variant="secondary" className="text-[9px] flex items-center gap-1">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {new Date(summary.nextSession.session_date!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </Badge>
                      )}
                      {summary.daysToDelivery !== null && (
                        <Badge variant="secondary" className="text-[9px]">
                          Delivery in {summary.daysToDelivery}d
                        </Badge>
                      )}
                    </div>

                    {/* Budget */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Budget</span>
                        <span>£{(p.invoiced || 0).toLocaleString()} / £{(p.budget || 0).toLocaleString()}</span>
                      </div>
                      <Progress value={p.budget ? ((p.invoiced || 0) / p.budget) * 100 : 0} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {filteredProjects.map((p) => {
              const summary = getProjectSummary(p);
              return (
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.organisations?.name || "No organisation"}</p>
                    </div>
                    {summary.nextMilestone && (
                      <span className="text-xs text-primary font-medium hidden sm:block">Next: {summary.nextMilestone.label}</span>
                    )}
                    {summary.overdueTasks > 0 && <Badge variant="destructive" className="text-[9px]">{summary.overdueTasks} overdue</Badge>}
                    <Badge className={statusStyles[p.status]}>{p.status}</Badge>
                    <span className="text-sm font-semibold text-primary w-24 text-right">£{(p.budget || 0).toLocaleString()}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Milestone</TableHead>
                  <TableHead>Milestones</TableHead>
                  <TableHead>Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((p) => {
                  const summary = getProjectSummary(p);
                  return (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.organisations?.name || "—"}</TableCell>
                      <TableCell><Badge className={statusStyles[p.status]}>{p.status}</Badge></TableCell>
                      <TableCell className="text-primary text-sm">{summary.nextMilestone?.label || "✓ All done"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{summary.completedMilestones}/{summary.totalMilestones}</TableCell>
                      <TableCell className="font-semibold text-primary">£{(p.budget || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selected && <ProjectDetailPanel project={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ProjectDetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const { data: tasks } = useTasks();
  const { data: deals } = useDeals();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editValues, setEditValues] = useState({
    name: project.name,
    status: project.status,
    neuro_phase: project.neuro_phase || "needs",
    budget: project.budget?.toString() || "0",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    description: project.description || "",
  });

  const handleSave = () => {
    updateProject.mutate(
      { id: project.id, ...editValues, budget: parseFloat(editValues.budget) || 0, start_date: editValues.start_date || null, end_date: editValues.end_date || null, neuro_phase: editValues.neuro_phase as any },
      { onSuccess: () => { toast.success("Project updated"); setEditing(false); } }
    );
  };

  const projectTasks = tasks?.filter((t) => t.project_id === project.id) || [];
  const linkedDeal = deals?.find((d) => d.id === project.deal_id);
  const completedTasks = projectTasks.filter((t) => t.status === "done").length;
  const totalTasks = projectTasks.length;
  const phaseIndex = phaseToIndex[project.neuro_phase || "needs"] || 0;

  return (
    <DetailPanel
      open={!!project}
      onOpenChange={onClose}
      title={project.name}
      badge={{ label: project.status, className: statusStyles[project.status] }}
      fields={editing ? [] : [
        { label: "Organisation", value: project.organisations?.name },
        { label: "NEURO Phase", value: project.neuro_phase ? phaseLabels[neuroPhases[phaseToIndex[project.neuro_phase]]] : undefined },
        { label: "Budget", value: `£${(project.budget || 0).toLocaleString()}` },
        { label: "Invoiced", value: `£${(project.invoiced || 0).toLocaleString()}` },
        { label: "Start Date", value: project.start_date ? new Date(project.start_date).toLocaleDateString("en-GB") : undefined },
        { label: "End Date", value: project.end_date ? new Date(project.end_date).toLocaleDateString("en-GB") : undefined },
      ]}
    >
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={editValues.status} onValueChange={(v) => setEditValues({ ...editValues, status: v as any })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["setup", "active", "paused", "completed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">NEURO Phase</label>
              <Select value={editValues.neuro_phase} onValueChange={(v: string) => setEditValues({ ...editValues, neuro_phase: v as any })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["needs", "engage", "understand", "realise", "ongoing"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Budget (£)</label>
              <Input value={editValues.budget} onChange={(e) => setEditValues({ ...editValues, budget: e.target.value })} className="h-9" type="number" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input type="date" value={editValues.start_date} onChange={(e) => setEditValues({ ...editValues, start_date: e.target.value })} className="h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">End Date</label>
            <Input type="date" value={editValues.end_date} onChange={(e) => setEditValues({ ...editValues, end_date: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={editValues.description} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateProject.isPending}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Project</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      )}

      {/* NEURO Phase indicator */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1.5">NEURO Progress</p>
        <div className="flex gap-1">
          {neuroPhases.map((letter, i) => (
            <div key={letter} className={`flex-1 h-7 rounded flex items-center justify-center text-[10px] font-bold ${i <= phaseIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{letter}</div>
          ))}
        </div>
      </div>

      {linkedDeal && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Linked Deal</p>
          <p className="text-sm font-medium">{linkedDeal.title}</p>
          <span className="text-xs text-primary font-semibold">£{(linkedDeal.value || 0).toLocaleString()}</span>
        </div>
      )}

      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="milestones" className="text-xs">Milestones</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Sessions</TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs">Deliveries</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">Docs</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="pt-4">
          <MilestonesTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          {totalTasks > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedTasks}/{totalTasks} complete</span>
              </div>
              <Progress value={(completedTasks / totalTasks) * 100} className="h-1.5" />
            </div>
          )}
          {!projectTasks.length ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="space-y-1.5">
              {projectTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-md border text-sm">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === "done" ? "bg-green-500" : t.status === "in_progress" ? "bg-blue-500" : t.status === "blocked" ? "bg-red-500" : "bg-muted-foreground"}`} />
                  <span className={`flex-1 truncate ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  <Badge variant="secondary" className="text-[9px] capitalize">{t.priority}</Badge>
                  {t.due_date && <span className="text-[10px] text-muted-foreground">{new Date(t.due_date).toLocaleDateString("en-GB")}</span>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="pt-4">
          <SessionsTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="deliveries" className="pt-4">
          <DeliveriesTab projectId={project.id} dealId={project.deal_id} />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <DocumentsTab projectId={project.id} dealId={project.deal_id} />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <ActivityTab organisationId={project.organisation_id} />
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title={project.name}
        onConfirm={() => deleteProject.mutate(project.id, { onSuccess: () => { toast.success("Project deleted"); onClose(); }, onError: (e) => toast.error(e.message) })}
        loading={deleteProject.isPending} />
    </DetailPanel>
  );
}
