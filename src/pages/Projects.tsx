import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProjects, Project } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useDeals } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDialogs } from "@/App";

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

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [view, setView] = useState<ViewMode>("board");
  const [selected, setSelected] = useState<Project | null>(null);
  const { openCreateProject } = useDialogs();

  return (
    <>
      <PageHeader title="Projects" searchPlaceholder="Search projects..." actionLabel="New Project" onAction={openCreateProject}>
        <ViewToggle value={view} onChange={setView} options={["board", "list", "table"]} />
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
        ) : !projects?.length ? (
          <div className="p-12 text-center text-muted-foreground"><p>No projects yet. Create your first project to get started.</p></div>
        ) : view === "board" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const phaseIndex = phaseToIndex[p.neuro_phase || "needs"] || 0;
              const invoiced = p.invoiced || 0;
              const budget = p.budget || 1;
              return (
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.organisations?.name || "No organisation"}</p>
                      </div>
                      <Badge className={statusStyles[p.status]}>{p.status}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">NEURO Phase</span>
                        <span className="font-medium">{phaseLabels[neuroPhases[phaseIndex]]}</span>
                      </div>
                      <div className="flex gap-1">
                        {neuroPhases.map((letter, i) => (
                          <div key={letter} className={`flex-1 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${i <= phaseIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{letter}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">£{invoiced.toLocaleString()} / £{budget.toLocaleString()}</span>
                      </div>
                      <Progress value={(invoiced / budget) * 100} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">{p.start_date && <span>Started: {new Date(p.start_date).toLocaleDateString("en-GB")}</span>}</div>
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{p.owner_id ? "U" : "?"}</AvatarFallback></Avatar>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {projects.map((p) => (
              <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(p)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{p.name}</p><p className="text-xs text-muted-foreground">{p.organisations?.name || "No organisation"}</p></div>
                  <Badge className={statusStyles[p.status]}>{p.status}</Badge>
                  <span className="text-sm font-semibold text-primary w-24 text-right">£{(p.budget || 0).toLocaleString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead className="pl-6">Project</TableHead><TableHead>Organisation</TableHead><TableHead>Status</TableHead><TableHead>NEURO Phase</TableHead><TableHead>Budget</TableHead><TableHead>Invoiced</TableHead></TableRow></TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                    <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.organisations?.name || "—"}</TableCell>
                    <TableCell><Badge className={statusStyles[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell className="capitalize">{p.neuro_phase || "—"}</TableCell>
                    <TableCell className="font-semibold text-primary">£{(p.budget || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">£{(p.invoiced || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
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
      fields={[
        { label: "Organisation", value: project.organisations?.name },
        { label: "NEURO Phase", value: project.neuro_phase ? phaseLabels[neuroPhases[phaseToIndex[project.neuro_phase]]] : undefined },
        { label: "Budget", value: `£${(project.budget || 0).toLocaleString()}` },
        { label: "Invoiced", value: `£${(project.invoiced || 0).toLocaleString()}` },
        { label: "Start Date", value: project.start_date ? new Date(project.start_date).toLocaleDateString("en-GB") : undefined },
        { label: "End Date", value: project.end_date ? new Date(project.end_date).toLocaleDateString("en-GB") : undefined },
        { label: "Description", value: project.description },
      ]}
    >
      {/* NEURO Phase indicator */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1.5">NEURO Progress</p>
        <div className="flex gap-1">
          {neuroPhases.map((letter, i) => (
            <div key={letter} className={`flex-1 h-7 rounded flex items-center justify-center text-[10px] font-bold ${i <= phaseIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{letter}</div>
          ))}
        </div>
      </div>

      {/* Linked Deal with workshop breakdown */}
      {linkedDeal && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Linked Deal</p>
          <p className="text-sm font-medium">{linkedDeal.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-primary font-semibold">£{(linkedDeal.value || 0).toLocaleString()}</span>
            {(linkedDeal as any).package_size && (
              <Badge className={packageColors[(linkedDeal as any).package_size] || "bg-muted"} variant="secondary">
                {(linkedDeal as any).package_size}
              </Badge>
            )}
          </div>
          {((linkedDeal as any).total_workshops > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(linkedDeal as any).workshops_aware > 0 && <Badge variant="secondary" className="text-[9px]">Aware: {(linkedDeal as any).workshops_aware}</Badge>}
              {(linkedDeal as any).workshops_champion > 0 && <Badge variant="secondary" className="text-[9px]">Champion: {(linkedDeal as any).workshops_champion}</Badge>}
              {(linkedDeal as any).workshops_manager > 0 && <Badge variant="secondary" className="text-[9px]">Manager: {(linkedDeal as any).workshops_manager}</Badge>}
              {(linkedDeal as any).workshops_leader > 0 && <Badge variant="secondary" className="text-[9px]">Leader: {(linkedDeal as any).workshops_leader}</Badge>}
              {(linkedDeal as any).workshops_bespoke > 0 && <Badge variant="secondary" className="text-[9px]">Bespoke: {(linkedDeal as any).workshops_bespoke}</Badge>}
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        </TabsList>
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
        <TabsContent value="overview" className="pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-primary">{totalTasks}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          {project.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DetailPanel>
  );
}
