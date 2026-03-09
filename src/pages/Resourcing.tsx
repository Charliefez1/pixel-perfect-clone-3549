import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, AlertTriangle } from "lucide-react";

// Team members are loaded dynamically from profiles

export default function Resourcing() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: timeEntries, isLoading: loadingTime } = useTimeEntries();
  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const team: TeamMember[] = useMemo(() => {
    const members = (profiles || []).map(p => ({
      id: p.user_id,
      name: p.display_name || p.email || "Unknown",
      role: "",
      avatar: (p.display_name || p.email || "?")[0].toUpperCase(),
    }));
    members.push({ id: "unassigned", name: "Unassigned", role: "", avatar: "?" });
    return members;
  }, [profiles]);

  const isLoading = loadingProjects || loadingTasks || loadingTime;

  const activeProjects = projects?.filter(p => p.status === "active") || [];
  const totalTasks = tasks?.length || 0;
  const openTasks = tasks?.filter(t => t.status !== "done").length || 0;
  const weekHours = useMemo(() => {
    if (!timeEntries) return 0;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return timeEntries.filter(e => new Date(e.date) >= weekAgo).reduce((s, e) => s + e.duration_minutes, 0) / 60;
  }, [timeEntries]);

  const projectUtilisation = useMemo(() => {
    if (!activeProjects.length) return [];
    return activeProjects.map(p => {
      const projectTasks = tasks?.filter(t => t.project_id === p.id) || [];
      const done = projectTasks.filter(t => t.status === "done").length;
      const total = projectTasks.length || 1;
      const hours = timeEntries?.filter(e => e.project_id === p.id).reduce((s, e) => s + e.duration_minutes, 0) || 0;
      return { ...p, tasksDone: done, tasksTotal: total, progress: Math.round((done / total) * 100), hoursLogged: Math.round(hours / 60) };
    });
  }, [activeProjects, tasks, timeEntries]);

  return (
    <>
      <PageHeader title="Resourcing" searchPlaceholder="Search..." />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active Projects</p>{isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{activeProjects.length}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Open Tasks</p>{isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{openTasks}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Hours This Week</p>{isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{weekHours.toFixed(1)}h</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Utilisation</p>{isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{Math.min(100, Math.round((weekHours / 80) * 100))}%</p>}</CardContent></Card>
        </div>

        {/* Team overview */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {team.map(member => {
              const memberTasks = tasks?.filter(t => t.status !== "done") || [];
              const count = member.id === "unassigned" ? memberTasks.filter(t => !t.assignee_id).length : 0;
              return (
                <Card key={member.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{member.avatar}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant="secondary">{count || "—"} tasks</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Project utilisation */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Project Utilisation</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !projectUtilisation.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No active projects to display.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {projectUtilisation.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.organisations?.name || "No client"}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.hoursLogged}h logged</span>
                        <span>{p.tasksDone}/{p.tasksTotal} tasks</span>
                      </div>
                    </div>
                    <Progress value={p.progress} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
