import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProjects, Project } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useSessions } from "@/hooks/useSessions";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProjectMilestones } from "@/hooks/useProjectMilestones";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDialogs } from "@/App";
import { AlertTriangle, CalendarDays, CheckCircle2, Upload, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, realise: 3, ongoing: 4 };
const statusStyles: Record<string, string> = {
  setup: "bg-muted text-muted-foreground",
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  paused: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  completed: "bg-primary/20 text-primary",
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
  const [importOpen, setImportOpen] = useState(false);
  const { openCreateProject, openCreateProjectFromPlan } = useDialogs();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={openCreateProjectFromPlan}>
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">New from Plan</span>
          </Button>
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
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/projects/${p.id}`)}>
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
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/projects/${p.id}`)}>
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
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
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

    </>
  );
}
