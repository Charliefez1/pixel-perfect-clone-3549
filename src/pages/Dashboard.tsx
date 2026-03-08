import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Briefcase, FolderKanban, CheckSquare, Receipt, Calendar, AlertTriangle, PieChart, ArrowRight, Clock, Mail, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RPieChart, Pie } from "recharts";
import { useDashboardStats, usePipelineByStage } from "@/hooks/useDashboardStats";
import { useUpcomingSessions } from "@/hooks/useSessions";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useDeals } from "@/hooks/useDeals";
import { useInvoices } from "@/hooks/useInvoices";
import { useDeliveries } from "@/hooks/useDeliveries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format, parseISO, isPast, differenceInDays, isThisWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const neuroColors = [
  { name: "Needs", color: "hsl(210, 100%, 61%)" },
  { name: "Engage", color: "hsl(190, 60%, 50%)" },
  { name: "Understand", color: "hsl(142, 71%, 45%)" },
  { name: "Realise", color: "hsl(38, 92%, 50%)" },
  { name: "Ongoing", color: "hsl(0, 0%, 64%)" },
];

const sectorColors: Record<string, string> = {
  law: "hsl(210, 70%, 55%)",
  energy: "hsl(38, 92%, 50%)",
  finance: "hsl(142, 71%, 45%)",
  public_sector: "hsl(190, 60%, 50%)",
  tech: "hsl(280, 60%, 55%)",
  other: "hsl(0, 0%, 64%)",
};

export default function Dashboard() {
  const [syncing, setSyncing] = useState(false);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineByStage();
  const { data: sessions, isLoading: sessionsLoading } = useUpcomingSessions();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();
  const { data: deals } = useDeals();
  const { data: invoices } = useInvoices();
  const { data: deliveries } = useDeliveries();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSyncGmail = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-gmail");
      if (error) throw error;
      toast.success(`Synced ${data.synced} emails, skipped ${data.skipped}`);
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    } catch (e: any) {
      toast.error(e.message || "Gmail sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // NEURO phase distribution
  const neuroData = neuroColors.map((n) => ({
    name: n.name,
    value: projects?.filter((p) => p.neuro_phase === n.name.toLowerCase()).length || 0,
    fill: n.color,
  }));

  // Task stats
  const totalTasks = tasks?.length || 0;
  const doneTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueTasks = tasks?.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done") || [];

  // Stale deals (no stage change in 14+ days, not won/lost)
  const staleDeals = deals?.filter((d) => {
    if (["won", "lost"].includes(d.stage)) return false;
    return differenceInDays(new Date(), new Date(d.stage_entered_at)) > 14;
  }) || [];

  // Overdue invoices
  const overdueInvoices = invoices?.filter((inv) => inv.status === "overdue" || (inv.status === "sent" && inv.due_date && isPast(new Date(inv.due_date)))) || [];
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

  // Paid this month
  const paidThisMonth = invoices?.filter((inv) => {
    if (inv.status !== "paid" || !inv.paid_date) return false;
    const d = new Date(inv.paid_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

  // Pipeline by sector (from organisations)
  const sectorMap: Record<string, number> = {};
  deals?.filter((d) => !["won", "lost"].includes(d.stage)).forEach((d) => {
    const sector = (d.organisations as any)?.sector || "other";
    sectorMap[sector] = (sectorMap[sector] || 0) + (d.value || 0);
  });
  const sectorData = Object.entries(sectorMap).map(([sector, value]) => ({
    name: sector,
    value,
    fill: sectorColors[sector] || sectorColors.other,
  }));

  // Upcoming this week (sessions + deal follow-ups)
  const upcomingItems: Array<{ type: string; title: string; org: string; date: Date; owner: string }> = [];
  sessions?.forEach((s) => {
    if (s.session_date && isThisWeek(parseISO(s.session_date), { weekStartsOn: 1 })) {
      upcomingItems.push({
        type: "session",
        title: s.title,
        org: s.projects?.organisations?.name || s.projects?.name || "",
        date: parseISO(s.session_date),
        owner: "team",
      });
    }
  });
  deals?.forEach((d) => {
    if (d.expected_close_date && isThisWeek(parseISO(d.expected_close_date), { weekStartsOn: 1 })) {
      upcomingItems.push({
        type: "deal",
        title: d.title,
        org: d.organisations?.name || "",
        date: parseISO(d.expected_close_date),
        owner: (d as any).owner || "—",
      });
    }
  });
  upcomingItems.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Deliveries needing feedback (delivered 2+ days ago, feedback not sent)
  const feedbackNeeded = deliveries?.filter((d) => 
    d.status === "delivered" && !d.feedback_sent && d.delivery_date && 
    differenceInDays(new Date(), new Date(d.delivery_date)) >= 2
  ) || [];

  // Needs attention items — sorted by urgency, max 5
  const attentionItems: Array<{ id: string; label: string; detail: string; action: string; route: string; onAction?: () => void }> = [];
  staleDeals.forEach((d) => {
    attentionItems.push({
      id: `stale-${d.id}`,
      label: d.title,
      detail: `${d.organisations?.name || "Unknown"} · ${differenceInDays(new Date(), new Date(d.stage_entered_at))}d stale`,
      action: "View Deal",
      route: `/deals?open=${d.id}`,
    });
  });
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
  feedbackNeeded.slice(0, 2).forEach((d) => {
    attentionItems.push({
      id: `feedback-${d.id}`,
      label: d.title,
      detail: `${d.organisations?.name || "Unknown"} · Feedback not sent`,
      action: "Send Feedback",
      route: "/deliveries",
      onAction: async () => {
        await supabase.from("deliveries").update({ feedback_sent: true }).eq("id", d.id);
        queryClient.invalidateQueries({ queryKey: ["deliveries"] });
        toast.success("Feedback form queued");
      },
    });
  });
  // Sort and limit to 5
  const limitedAttention = attentionItems.slice(0, 5);

  const statCards = [
    {
      label: "Pipeline Value",
      value: stats ? `£${stats.pipelineValue.toLocaleString()}` : "—",
      change: stats ? `${stats.dealCount} deals` : "",
      icon: Briefcase,
      color: "text-primary",
    },
    {
      label: "Revenue This Month",
      value: `£${paidThisMonth.toLocaleString()}`,
      change: "paid invoices",
      icon: TrendingUp,
      color: "text-[hsl(142,71%,45%)]",
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects?.toString() || "0",
      change: "in progress",
      icon: FolderKanban,
      color: "text-[hsl(var(--stage-qualified))]",
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
      <div className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back to NDG Hub</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSyncGmail} disabled={syncing}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
          Sync Gmail
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
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

        {/* Row 2: Needs Attention + Pipeline by Sector */}
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attentionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">All clear — no items need attention.</p>
              ) : (
                <div className="space-y-2">
                  {attentionItems.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => navigate(item.route)}>
                        {item.action}
                        <ArrowRight className="h-3 w-3 ml-1" />
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
                <PieChart className="h-4 w-4 text-primary" />
                Pipeline by Sector
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sectorData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No pipeline data yet.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={130}>
                    <RPieChart>
                      <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                        {sectorData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {sectorData.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.fill }} />
                        <span className="flex-1 capitalize">{s.name.replace("_", " ")}</span>
                        <span className="font-medium text-xs">£{s.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Pipeline by Stage + NEURO Phase */}
        <div className="grid gap-6 lg:grid-cols-2">
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

        {/* Row 4: Task Completion + Upcoming This Week */}
        <div className="grid gap-6 lg:grid-cols-2">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nothing scheduled this week.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingItems.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                      <div className="text-center shrink-0 w-12">
                        <p className="text-xs text-muted-foreground">{format(item.date, "EEE")}</p>
                        <p className="text-lg font-bold">{format(item.date, "d")}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.org} · {item.owner}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
