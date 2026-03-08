import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  FolderKanban,
  AlertTriangle,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const summaryCards = [
  {
    title: "Open Deals",
    value: "£284,500",
    subtitle: "12 active deals",
    icon: TrendingUp,
    trend: "+3 this week",
  },
  {
    title: "Active Projects",
    value: "8",
    subtitle: "3 in delivery phase",
    icon: FolderKanban,
    trend: "2 starting soon",
  },
  {
    title: "Overdue Tasks",
    value: "5",
    subtitle: "Across 3 projects",
    icon: AlertTriangle,
    trend: "2 critical",
  },
  {
    title: "Outstanding Invoices",
    value: "£42,300",
    subtitle: "6 unpaid",
    icon: FileText,
    trend: "1 overdue",
  },
];

const pipelineData = [
  { stage: "Lead", value: 45000 },
  { stage: "Qualified", value: 62000 },
  { stage: "Proposal", value: 85000 },
  { stage: "Negotiation", value: 52500 },
  { stage: "Verbal Yes", value: 40000 },
];

const upcomingTasks = [
  { title: "Follow up with Barclays HR", due: "Today", priority: "high", project: "Barclays L&D" },
  { title: "Prepare proposal for NHS Trust", due: "Tomorrow", priority: "critical", project: "NHS Yorkshire" },
  { title: "Review session feedback", due: "Wed", priority: "medium", project: "Deloitte Wellbeing" },
  { title: "Send invoice to AstraZeneca", due: "Thu", priority: "low", project: "AZ Programme" },
];

const recentActivity = [
  { action: "Deal moved to Proposal Sent", entity: "Barclays Leadership Programme", time: "2h ago", user: "Charlie" },
  { action: "New contact added", entity: "Sarah Mitchell (NHS Trust)", time: "4h ago", user: "Rich" },
  { action: "Task completed", entity: "Prepare workshop materials", time: "Yesterday", user: "Charlie" },
  { action: "Invoice paid", entity: "INV-2024-041 (£8,500)", time: "Yesterday", user: "System" },
  { action: "Session delivered", entity: "Deloitte Resilience Workshop", time: "2 days ago", user: "Rich" },
];

const priorityColors: Record<string, string> = {
  critical: "bg-[hsl(var(--priority-critical))] text-primary-foreground",
  high: "bg-[hsl(var(--priority-high))] text-primary-foreground",
  medium: "bg-[hsl(var(--priority-medium))] text-foreground",
  low: "bg-[hsl(var(--priority-low))] text-primary-foreground",
};

export default function Dashboard() {
  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold">Good morning, Charlie</h2>
          <p className="text-muted-foreground">Here's what's happening across NDG Group today.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                <p className="text-xs text-primary flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {card.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Pipeline Value by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="stage" className="text-xs" tick={{ fill: 'hsl(215, 14%, 46%)' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(215, 14%, 46%)' }} tickFormatter={(v) => `£${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`£${value.toLocaleString()}`, 'Value']}
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 100%)',
                      border: '1px solid hsl(214, 20%, 90%)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(129, 44%, 50.6%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.map((task, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Badge className={`${priorityColors[task.priority]} text-[10px] px-1.5 py-0.5 shrink-0 mt-0.5`}>
                    {task.priority}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project} · {task.due}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{item.action}</span>
                      {" — "}
                      <span className="text-muted-foreground">{item.entity}</span>
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {item.user} · {item.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
