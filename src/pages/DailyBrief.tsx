import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjects } from "@/hooks/useProjects";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useInvoices } from "@/hooks/useInvoices";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isTomorrow, isPast, parseISO, differenceInDays, addDays, isBefore, isAfter, startOfDay } from "date-fns";
import { toast } from "sonner";
import {
  Sun, Calendar, CheckSquare, Clock, AlertTriangle, ArrowRight,
  Receipt, Package, Coffee, Target, Zap
} from "lucide-react";

export default function DailyBrief() {
  const navigate = useNavigate();
  const { data: tasks } = useTasks();
  const { data: sessions } = useUpcomingSessions();
  const { data: deliveries } = useDeliveries();
  const { data: invoices } = useInvoices();
  const { data: timeEntries } = useTimeEntries();
  const { data: projects } = useProjects();
  const updateTask = useUpdateTask();

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // Today's sessions
  const todaySessions = useMemo(
    () => sessions?.filter((s) => s.session_date && isToday(parseISO(s.session_date))) || [],
    [sessions]
  );

  // Tomorrow's sessions
  const tomorrowSessions = useMemo(
    () => sessions?.filter((s) => s.session_date && isTomorrow(parseISO(s.session_date))) || [],
    [sessions]
  );

  // Tasks due today
  const tasksDueToday = useMemo(
    () => tasks?.filter((t) => t.due_date && isToday(parseISO(t.due_date)) && t.status !== "done") || [],
    [tasks]
  );

  // Overdue tasks
  const overdueTasks = useMemo(
    () => tasks?.filter((t) => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && t.status !== "done") || [],
    [tasks]
  );

  // Deliveries this week
  const weekDeliveries = useMemo(
    () => deliveries?.filter((d) => {
      if (!d.delivery_date) return false;
      const dd = parseISO(d.delivery_date);
      return isAfter(dd, addDays(today, -1)) && isBefore(dd, addDays(today, 7));
    }) || [],
    [deliveries, today]
  );

  // Overdue invoices
  const overdueInvoices = useMemo(
    () => invoices?.filter((inv) =>
      (inv.status === "overdue" || (inv.status === "sent" && inv.due_date && isPast(parseISO(inv.due_date))))
    ) || [],
    [invoices]
  );

  // Time logged today
  const todayTime = useMemo(
    () => timeEntries?.filter((e) => e.date === todayStr).reduce((s, e) => s + e.duration_minutes, 0) || 0,
    [timeEntries, todayStr]
  );

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleToggleTask = (taskId: string, done: boolean) => {
    updateTask.mutate(
      { id: taskId, status: done ? "done" : "todo" },
      { onSuccess: () => toast.success(done ? "Task completed!" : "Task reopened") }
    );
  };

  return (
    <>
      <div className="border-b border-border bg-card px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Sun className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{greeting}</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{todaySessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{tasksDueToday.length}</p>
              <p className="text-xs text-muted-foreground">Tasks Due</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{overdueTasks.length}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{formatDuration(todayTime)}</p>
              <p className="text-xs text-muted-foreground">Tracked Today</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Schedule */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No sessions scheduled today.</p>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="text-center shrink-0 w-14">
                        <p className="text-sm font-bold">
                          {s.session_date ? format(parseISO(s.session_date), "HH:mm") : "TBC"}
                        </p>
                        {s.duration_minutes && (
                          <p className="text-[10px] text-muted-foreground">{s.duration_minutes}m</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.location || "No location"}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.session_type === "workshop" ? "W" : "M"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {tomorrowSessions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Tomorrow: {tomorrowSessions.length} session{tomorrowSessions.length > 1 ? "s" : ""}</p>
                  {tomorrowSessions.slice(0, 2).map((s) => (
                    <p key={s.id} className="text-xs text-muted-foreground">• {s.title}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Focus: Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksDueToday.length === 0 && overdueTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No tasks due today. Great job!</p>
              ) : (
                <div className="space-y-2">
                  {overdueTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-md border border-red-200 bg-red-50/50 dark:bg-red-950/10">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggleTask(t.id, true)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-red-500">
                          {t.due_date && `${differenceInDays(new Date(), parseISO(t.due_date))}d overdue`}
                          {t.projects?.name && ` · ${t.projects.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tasksDueToday.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-md border">
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleToggleTask(t.id, true)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due today{t.projects?.name && ` · ${t.projects.name}`}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{t.priority}</Badge>
                    </div>
                  ))}
                </div>
              )}
              {(overdueTasks.length > 3) && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => navigate("/tasks")}>
                  +{overdueTasks.length - 3} more overdue
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming Deliveries */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Deliveries This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekDeliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No deliveries this week.</p>
              ) : (
                <div className="space-y-2">
                  {weekDeliveries.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50">
                      <div className="text-center shrink-0 w-10">
                        <p className="text-xs font-bold">{d.delivery_date ? format(parseISO(d.delivery_date), "EEE") : "?"}</p>
                        <p className="text-sm font-bold">{d.delivery_date ? format(parseISO(d.delivery_date), "d") : ""}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.title}</p>
                        <p className="text-[10px] text-muted-foreground">{d.organisations?.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Invoices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-500" />
                Invoice Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No overdue invoices.</p>
              ) : (
                <div className="space-y-2">
                  {overdueInvoices.slice(0, 4).map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2 p-2 rounded-md border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{inv.invoice_number}</p>
                        <p className="text-[10px] text-muted-foreground">
                          £{(inv.total || 0).toLocaleString()}
                          {inv.due_date && ` · ${differenceInDays(new Date(), parseISO(inv.due_date))}d overdue`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => navigate("/time-tracking")}>
                <Clock className="h-4 w-4" /> Start Timer
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => navigate("/tasks")}>
                <CheckSquare className="h-4 w-4" /> View All Tasks
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => navigate("/scheduling")}>
                <Calendar className="h-4 w-4" /> Week Calendar
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => navigate("/portfolio")}>
                <AlertTriangle className="h-4 w-4" /> Portfolio Health
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
