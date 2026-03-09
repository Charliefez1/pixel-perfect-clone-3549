import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProjects, useUpdateProject, Project } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useSessions } from "@/hooks/useSessions";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAllProjectMilestones } from "@/hooks/useProjectMilestones";
import { Skeleton } from "@/components/ui/skeleton";
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
const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, redesign: 3, optimise: 4 };

const pipelineStages = [
  { key: "contract_signing", label: "Contract Signing" },
  { key: "onboarding", label: "Onboarding" },
  { key: "planning", label: "Planning" },
  { key: "data_gathering", label: "Data Gathering" },
  { key: "content_build", label: "Content Build" },
  { key: "delivery", label: "Delivery" },
  { key: "analysis_feedback", label: "Analysis & Feedback" },
  { key: "closing", label: "Closing" },
] as const;

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
  const [view, setView] = useState<"board" | "pipeline" | "list" | "table">("board");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [importOpen, setImportOpen] = useState(false);
  const { openCreateProject, openCreateProjectFromPlan } = useDialogs();
  const updateProject = useUpdateProject();
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
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            {(["board", "pipeline", "list", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1.5 transition-colors capitalize ${view === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              >
                {v === "pipeline" ? "Pipeline" : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
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
        ) : view === "pipeline" ? (
          <PipelineBoard
            projects={filteredProjects}
            tasks={tasks}
            getProjectSummary={getProjectSummary}
            onProjectClick={(id) => navigate(`/projects/${id}`)}
            updateProject={updateProject}
          />
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

function PipelineBoard({
  projects,
  tasks,
  getProjectSummary,
  onProjectClick,
  updateProject,
}: {
  projects: Project[];
  tasks: any[] | undefined;
  getProjectSummary: (p: Project) => any;
  onProjectClick: (id: string) => void;
  updateProject: ReturnType<typeof useUpdateProject>;
}) {
  const moveToStage = (projectId: string, stage: string) => {
    updateProject.mutate({ id: projectId, stage: stage } as any);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
      {pipelineStages.map((stage) => {
        const stageProjects = projects.filter(
          (p) => (p.stage || "contract_signing") === stage.key
        );
        return (
          <div key={stage.key} className="flex-shrink-0 w-[260px]">
            <div className="flex items-center gap-2 pb-2 mb-2 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stage.label}
              </span>
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {stageProjects.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {stageProjects.map((p) => {
                const phaseIndex = phaseToIndex[p.neuro_phase || "needs"] || 0;
                const pTasks = tasks?.filter((t) => t.project_id === p.id) || [];
                const taskCount = pTasks.length;
                const doneTasks = pTasks.filter((t) => t.status === "done").length;
                return (
                  <Card
                    key={p.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onProjectClick(p.id)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="text-sm font-medium leading-tight truncate">{p.name}</p>
                        <Badge className={`${statusStyles[p.status]} text-[9px] shrink-0`}>{p.status}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.organisations?.name || "No organisation"}
                      </p>
                      {/* NEURO mini bar */}
                      <div className="flex gap-0.5">
                        {neuroPhases.map((letter, i) => (
                          <div key={letter} className={`flex-1 h-1 rounded-full ${i <= phaseIndex ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{doneTasks}/{taskCount} tasks</span>
                        {p.budget ? <span className="font-medium text-primary">£{p.budget.toLocaleString()}</span> : null}
                      </div>
                      {/* Move buttons */}
                      <div className="flex gap-1 flex-wrap pt-1">
                        {pipelineStages
                          .filter((s) => s.key !== stage.key)
                          .slice(0, 3)
                          .map((s) => (
                            <button
                              key={s.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToStage(p.id, s.key);
                              }}
                              className="text-[8px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors leading-tight"
                            >
                              {s.label}
                            </button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {stageProjects.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground/50">
                  No projects
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
