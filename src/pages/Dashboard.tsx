import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Briefcase, FolderKanban, CheckSquare, Receipt, Calendar, AlertTriangle, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RPieChart, Pie } from "recharts";
import { useDashboardStats, usePipelineByStage } from "@/hooks/useDashboardStats";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isPast } from "date-fns";

const neuroColors = [
  { name: "Needs", color: "hsl(210, 100%, 61%)" },
  { name: "Engage", color: "hsl(190, 60%, 50%)" },
  { name: "Understand", color: "hsl(142, 71%, 45%)" },
  { name: "Realise", color: "hsl(38, 92%, 50%)" },
  { name: "Ongoing", color: "hsl(0, 0%, 64%)" },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineByStage();
  const { data: sessions, isLoading: sessionsLoading } = useUpcomingSessions();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();

  // NEURO phase distribution
  const neuroData = neuroColors.map((n) => ({
    name: n.name,
    value: projects?.filter((p) => p.neuro_phase === n.name.toLowerCase()).length || 0,
    fill: n.color,
  }));

  // Task completion rate
  const totalTasks = tasks?.length || 0;
  const doneTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Overdue tasks
  const overdueTasks = tasks?.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done") || [];

  const statCards = [
    {
      label: "Pipeline Value",
      value: stats ? `£${stats.pipelineValue.toLocaleString()}` : "—",
      change: stats ? `${stats.dealCount} deals` : "",
      icon: Briefcase,
      color: "text-primary",
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects?.toString() || "0",
      change: "active",
      icon: FolderKanban,
      color: "text-[hsl(var(--stage-qualified))]",
    },
    {
      label: "Overdue Tasks",
      value: stats?.overdueTasks?.toString() || "0",
      change: "need attention",
      icon: CheckSquare,
      color: "text-[hsl(var(--priority-high))]",
    },
    {
      label: "Outstanding Invoices",
      value: stats ? `£${stats.outstandingAmount.toLocaleString()}` : "—",
      change: stats ? `${stats.unpaidCount} unpaid` : "",
      icon: Receipt,
      color: "text-[hsl(var(--stage-proposal))]",
    },
  ];

  return (
    <>
      <div className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to Neurodiversity Global Hub</p>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Overdue alert banner */}
        {overdueTasks.length > 0 && (
          <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] shrink-0" />
              <div>
                <p className="text-sm font-medium">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""} need attention</p>
                <p className="text-xs text-muted-foreground">
                  {overdueTasks.slice(0, 3).map((t) => t.title).join(", ")}
                  {overdueTasks.length > 3 ? ` and ${overdueTasks.length - 3} more` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{s.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">{s.change}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pipeline Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} fontSize={11} />
                    <YAxis type="category" dataKey="stage" width={80} fontSize={11} />
                    <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                    <Bar dataKey="value" radius={4}>
                      {pipelineData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* NEURO Phase Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                NEURO Phase Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <RPieChart>
                    <Pie data={neuroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {neuroData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {neuroData.map((n) => (
                    <div key={n.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: n.fill }} />
                      <span className="flex-1">{n.name}</span>
                      <span className="font-medium">{n.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Task Completion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Task Completion
              </CardTitle>
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
                <div className="space-y-1.5">
                  <p className="text-sm"><span className="font-semibold">{doneTasks}</span> completed</p>
                  <p className="text-sm text-muted-foreground">{totalTasks - doneTasks} remaining</p>
                  <p className="text-sm text-muted-foreground">{totalTasks} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : !sessions?.length ? (
                <p className="text-sm text-muted-foreground py-4">No upcoming sessions scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 4).map((s) => {
                    const sessionDate = s.session_date ? parseISO(s.session_date) : null;
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                        {sessionDate && (
                          <div className="text-center shrink-0 w-12">
                            <p className="text-xs text-muted-foreground">{format(sessionDate, "MMM")}</p>
                            <p className="text-lg font-bold">{format(sessionDate, "d")}</p>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.projects?.organisations?.name || s.projects?.name || "No project"} • {s.duration_minutes || 60} min
                          </p>
                        </div>
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {s.facilitator_id ? "F" : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
