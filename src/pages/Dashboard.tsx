import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, CheckSquare, Receipt, Calendar, AlertTriangle, PieChart, ArrowRight, Plus, FileText } from "lucide-react";
import { useDialogs } from "@/App";
import { useUpcomingDeliveries } from "@/hooks/useDashboardStats";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useInvoices } from "@/hooks/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format, parseISO, isPast, differenceInDays, isThisWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

const neuroColors = [
  { name: "Needs", color: "hsl(210, 100%, 61%)" },
  { name: "Engage", color: "hsl(190, 60%, 50%)" },
  { name: "Understand", color: "hsl(142, 71%, 45%)" },
  { name: "Redesign", color: "hsl(38, 92%, 50%)" },
  { name: "Optimise", color: "hsl(0, 0%, 64%)" },
];

function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card className="lg:col-span-2"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { openCreateProject, openCreateContact, openCreateInvoice } = useDialogs();
  // Core data — 3 queries instead of 8. Stats are derived from these.
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  // Scoped queries (already filtered server-side)
  const { data: upcomingDeliveries } = useUpcomingDeliveries();
  const { data: sessions } = useUpcomingSessions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const isLoading = tasksLoading || projectsLoading || invoicesLoading;

  // Derive stats from already-fetched data (no extra queries)
  const activeProjects = useMemo(() => projects?.filter((p) => p.status === "active").length || 0, [projects]);

  const neuroData = useMemo(() => neuroColors.map((n) => ({
    name: n.name,
    value: projects?.filter((p) => p.neuro_phase === n.name.toLowerCase()).length || 0,
    fill: n.color,
  })), [projects]);

  const { totalTasks, doneTasks, completionRate, overdueTasks } = useMemo(() => {
    const total = tasks?.length || 0;
    const done = tasks?.filter((t) => t.status === "done").length || 0;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    const overdue = tasks?.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done") || [];
    return { totalTasks: total, doneTasks: done, completionRate: rate, overdueTasks: overdue };
  }, [tasks]);

  const { overdueInvoices, overdueAmount, paidThisMonth } = useMemo(() => {
    const overdue = invoices?.filter((inv) => inv.status === "overdue" || (inv.status === "sent" && inv.due_date && isPast(new Date(inv.due_date)))) || [];
    const amount = overdue.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paid = invoices?.filter((inv) => {
      if (inv.status !== "paid" || !inv.paid_date) return false;
      const d = new Date(inv.paid_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    return { overdueInvoices: overdue, overdueAmount: amount, paidThisMonth: paid };
  }, [invoices]);

  const outstandingAmount = useMemo(() =>
    invoices?.filter((i) => i.status !== "paid").reduce((sum, i) => sum + (i.total || 0), 0) || 0
  , [invoices]);
  const unpaidCount = useMemo(() => invoices?.filter((i) => i.status !== "paid").length || 0, [invoices]);

  const upcomingItems = useMemo(() => {
    const items: Array<{ type: string; title: string; org: string; date: Date }> = [];
    sessions?.forEach((s) => {
      if (s.session_date && isThisWeek(parseISO(s.session_date), { weekStartsOn: 1 })) {
        items.push({
          type: "session",
          title: s.title,
          org: s.projects?.organisations?.name || s.projects?.name || "N/A",
          date: parseISO(s.session_date),
        });
      }
    });
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [sessions]);

  // Needs attention items
  const attentionItems: Array<{ id: string; label: string; detail: string; action: string; route: string; onAction?: () => void }> = [];
  if (!isLoading) {
    overdueInvoices.forEach((inv) => {
      attentionItems.push({
        id: `inv-${inv.id}`,
        label: `Invoice ${inv.invoice_number}`,
        detail: `${(inv as any).organisations?.name || "Unknown"} · £${(inv.total || 0).toLocaleString()} · ${inv.due_date ? differenceInDays(new Date(), new Date(inv.due_date)) + "d overdue" : "overdue"}`,
        action: "View Invoice",
        route: "/invoices",
      });
    });
    overdueTasks.slice(0, 3).forEach((t) => {
      attentionItems.push({
        id: `task-${t.id}`,
        label: t.title,
        detail: `Overdue · ${t.projects?.name || "No project"}`,
        action: "View",
        route: "/tasks",
      });
    });
  }
  const limitedAttention = attentionItems.slice(0, 5);

  const statCards = [
    { label: "Active Projects", value: activeProjects.toString(), change: "in progress", icon: FolderKanban, color: "text-primary" },
    { label: "Overdue Tasks", value: overdueTasks.length.toString(), change: `${totalTasks} total`, icon: CheckSquare, color: "text-destructive" },
    { label: "Outstanding Invoices", value: `£${outstandingAmount.toLocaleString()}`, change: `${unpaidCount} unpaid`, icon: Receipt, color: "text-[hsl(var(--stage-proposal))]" },
    { label: "Revenue This Month", value: `£${paidThisMonth.toLocaleString()}`, change: "paid invoices", icon: Receipt, color: "text-[hsl(142,71%,45%)]" },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const displayName = profile?.display_name || "there";

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Greeting */}
      <div className="space-y-1">
        <p className="text-caption text-muted-foreground">{dateStr}</p>
        <h1 className="text-page-title">{greeting}, {displayName}</h1>
      </div>

      {/* Quick Action Pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => openCreateProject()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted text-accent-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-150">
          <Plus className="h-4 w-4" /> New Project
        </button>
        <button onClick={() => navigate("/daily")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted text-accent-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-150">
          <FileText className="h-4 w-4" /> Daily Brief
        </button>
        <button onClick={() => openCreateInvoice()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted text-accent-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-150">
          <Receipt className="h-4 w-4" /> New Invoice
        </button>
        <button onClick={() => openCreateContact()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted text-accent-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-150">
          <Plus className="h-4 w-4" /> New Contact
        </button>
      </div>

      {/* Overdue alert banner */}
      {(overdueTasks.length > 0 || overdueInvoices.length > 0) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {overdueTasks.length > 0 && `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`}
                {overdueTasks.length > 0 && overdueInvoices.length > 0 && " · "}
                {overdueInvoices.length > 0 && `£${overdueAmount.toLocaleString()} in overdue invoices`}
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
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <Badge variant="secondary" className="ml-auto text-[10px]">{s.change}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Needs Attention + Upcoming Deliveries */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {limitedAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">All clear — no items need attention.</p>
            ) : (
              <div className="space-y-2">
                {limitedAttention.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => {
                      if (item.onAction) { item.onAction(); return; }
                      navigate(item.route);
                    }}>
                      {item.action} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Deliveries This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!upcomingDeliveries || upcomingDeliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No deliveries scheduled this week.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeliveries.slice(0, 5).map((d) => {
                  const dateStr = d.delivery_date ? d.delivery_date : "";
                  return (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-xs text-muted-foreground">{dateStr ? format(parseISO(dateStr), "EEE") : ""}</p>
                      <p className="text-lg font-bold">{dateStr ? format(parseISO(dateStr), "d") : ""}</p>
                    </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.organisations?.name || d.projects?.name || "N/A"}</p>
                  </div>
                    <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Charts */}
      <DashboardCharts
        neuroData={neuroData}
        completionRate={completionRate}
        doneTasks={doneTasks}
        totalTasks={totalTasks}
      />

      {/* Row 4: Upcoming Sessions This Week */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Sessions This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nothing scheduled this week.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingItems.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-xs text-muted-foreground">{format(item.date, "EEE")}</p>
                    <p className="text-lg font-bold">{format(item.date, "d")}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.org}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
