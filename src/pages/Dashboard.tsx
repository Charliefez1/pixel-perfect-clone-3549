import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Briefcase, FolderKanban, CheckSquare, Receipt, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useDashboardStats, usePipelineByStage } from "@/hooks/useDashboardStats";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineByStage();
  const { data: sessions, isLoading: sessionsLoading } = useUpcomingSessions();

  const statCards = [
    { 
      label: "Pipeline Value", 
      value: stats ? `£${stats.pipelineValue.toLocaleString()}` : "—",
      change: stats ? `${stats.dealCount} deals` : "",
      icon: Briefcase, 
      color: "text-primary" 
    },
    { 
      label: "Active Projects", 
      value: stats?.activeProjects?.toString() || "0",
      change: "active",
      icon: FolderKanban, 
      color: "text-[hsl(var(--stage-qualified))]" 
    },
    { 
      label: "Overdue Tasks", 
      value: stats?.overdueTasks?.toString() || "0",
      change: "need attention",
      icon: CheckSquare, 
      color: "text-[hsl(var(--priority-high))]" 
    },
    { 
      label: "Outstanding Invoices", 
      value: stats ? `£${stats.outstandingAmount.toLocaleString()}` : "—",
      change: stats ? `${stats.unpaidCount} unpaid` : "",
      icon: Receipt, 
      color: "text-[hsl(var(--stage-proposal))]" 
    },
  ];

  return (
    <>
      <div className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to Neurodiversity Global Hub</p>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
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
