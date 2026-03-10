import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useInvoices } from "@/hooks/useInvoices";
import { useDeliveries } from "@/hooks/useDeliveries";
import { Skeleton } from "@/components/ui/skeleton";
import { isPast } from "date-fns";
import { FolderKanban, AlertTriangle, CheckCircle2, Clock, TrendingUp, ArrowRight, Circle } from "lucide-react";

type RAGStatus = "red" | "amber" | "green";

interface ProjectRAG {
  id: string;
  name: string;
  organisation: string;
  status: string;
  neuro_phase: string;
  stage: string | null;
  budget: number;
  invoiced: number;
  budgetPercent: number;
  overdueTasks: number;
  totalTasks: number;
  doneTasks: number;
  taskPercent: number;
  deliveriesTotal: number;
  deliveriesDone: number;
  rag: RAGStatus;
  ragReasons: string[];
}

function computeRAG(p: ProjectRAG): { rag: RAGStatus; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Overdue tasks
  if (p.overdueTasks >= 3) { score += 2; reasons.push(`${p.overdueTasks} overdue tasks`); }
  else if (p.overdueTasks > 0) { score += 1; reasons.push(`${p.overdueTasks} overdue task${p.overdueTasks > 1 ? "s" : ""}`); }

  // Budget burn
  if (p.budgetPercent > 100) { score += 2; reasons.push("Over budget"); }
  else if (p.budgetPercent > 85) { score += 1; reasons.push("Budget >85% used"); }

  // Task progress (low completion on active projects)
  if (p.status === "active" && p.totalTasks > 3 && p.taskPercent < 20) {
    score += 1;
    reasons.push("Low task completion");
  }

  if (score >= 3) return { rag: "red", reasons };
  if (score >= 1) return { rag: "amber", reasons };
  reasons.push("On track");
  return { rag: "green", reasons };
}

const ragColors: Record<RAGStatus, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

const ragBadgeStyles: Record<RAGStatus, string> = {
  red: "bg-red-500/10 text-red-600 border-red-200",
  amber: "bg-amber-500/10 text-amber-600 border-amber-200",
  green: "bg-green-500/10 text-green-600 border-green-200",
};

const neuroPhaseColors: Record<string, string> = {
  needs: "bg-blue-500",
  engage: "bg-teal-500",
  understand: "bg-green-500",
  redesign: "bg-amber-500",
  optimise: "bg-gray-400",
};

export default function Portfolio() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks } = useTasks();
  const { data: invoices } = useInvoices();
  const { data: deliveries } = useDeliveries();
  const navigate = useNavigate();

  const projectData = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter((p) => p.status === "active" || p.status === "setup")
      .map((p): ProjectRAG => {
        const projectTasks = tasks?.filter((t) => t.project_id === p.id) || [];
        const overdueTasks = projectTasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done").length;
        const doneTasks = projectTasks.filter((t) => t.status === "done").length;
        const totalTasks = projectTasks.length;
        const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        const projectInvoices = invoices?.filter((inv) => inv.project_id === p.id) || [];
        const invoiced = projectInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
        const budget = p.budget || 0;
        const budgetPercent = budget > 0 ? Math.round((invoiced / budget) * 100) : 0;

        const projectDeliveries = deliveries?.filter((d) => d.project_id === p.id) || [];
        const deliveriesDone = projectDeliveries.filter((d) => d.status === "complete").length;

        const base: ProjectRAG = {
          id: p.id,
          name: p.name,
          organisation: (p as any).organisations?.name || "",
          status: p.status,
          neuro_phase: p.neuro_phase || "needs",
          stage: (p as any).stage || null,
          budget,
          invoiced,
          budgetPercent,
          overdueTasks,
          totalTasks,
          doneTasks,
          taskPercent,
          deliveriesTotal: projectDeliveries.length,
          deliveriesDone,
          rag: "green",
          ragReasons: [],
        };

        const { rag, reasons } = computeRAG(base);
        return { ...base, rag, ragReasons: reasons };
      })
      .sort((a, b) => {
        const order: Record<RAGStatus, number> = { red: 0, amber: 1, green: 2 };
        return order[a.rag] - order[b.rag];
      });
  }, [projects, tasks, invoices, deliveries]);

  const ragCounts = useMemo(() => {
    const counts = { red: 0, amber: 0, green: 0 };
    projectData.forEach((p) => counts[p.rag]++);
    return counts;
  }, [projectData]);

  const totalBudget = projectData.reduce((s, p) => s + p.budget, 0);
  const totalInvoiced = projectData.reduce((s, p) => s + p.invoiced, 0);

  return (
    <>
      <PageHeader title="Portfolio" searchPlaceholder="Search projects..." showFilter={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ragCounts.red}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ragCounts.amber}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ragCounts.green}</p>
                <p className="text-xs text-muted-foreground">On Track</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">£{Math.round(totalInvoiced / 1000)}k</p>
                <p className="text-xs text-muted-foreground">of £{Math.round(totalBudget / 1000)}k budget</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RAG table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              Project Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {projectsLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : projectData.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No active projects to display.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-8">RAG</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>NEURO Phase</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status Notes</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectData.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/projects/${p.id}`)}>
                      <TableCell className="pl-6">
                        <div className={`w-3 h-3 rounded-full ${ragColors[p.rag]}`} />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.stage && <p className="text-xs text-muted-foreground">{p.stage}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.organisation}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${neuroPhaseColors[p.neuro_phase] || "bg-gray-400"}`} />
                          <span className="text-xs capitalize">{p.neuro_phase}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={p.taskPercent} className="h-1.5 w-20" />
                            <span className="text-xs text-muted-foreground">{p.doneTasks}/{p.totalTasks}</span>
                          </div>
                          {p.overdueTasks > 0 && (
                            <span className="text-xs text-red-500">{p.overdueTasks} overdue</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(p.budgetPercent, 100)} className="h-1.5 w-20" />
                            <span className="text-xs text-muted-foreground">{p.budgetPercent}%</span>
                          </div>
                          <span className="text-xs text-muted-foreground">£{p.invoiced.toLocaleString()} / £{p.budget.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.ragReasons.map((r, i) => (
                            <Badge key={i} variant="outline" className={`text-[10px] ${ragBadgeStyles[p.rag]}`}>
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* NEURO Phase Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Phase Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 h-8">
              {["needs", "engage", "understand", "redesign", "optimise"].map((phase) => {
                const count = projectData.filter((p) => p.neuro_phase === phase).length;
                const pct = projectData.length > 0 ? (count / projectData.length) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={phase}
                    className={`${neuroPhaseColors[phase]} rounded-md flex items-center justify-center text-white text-xs font-medium`}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                    title={`${phase}: ${count} projects`}
                  >
                    {count > 0 && <span className="capitalize">{phase.charAt(0).toUpperCase()}: {count}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
