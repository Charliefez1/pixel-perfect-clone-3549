import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Briefcase, FolderKanban, CheckSquare, Receipt, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const stats = [
  { label: "Pipeline Value", value: "£218,500", change: "+12%", icon: Briefcase, color: "text-primary" },
  { label: "Active Projects", value: "8", change: "+2", icon: FolderKanban, color: "text-[hsl(var(--stage-qualified))]" },
  { label: "Overdue Tasks", value: "3", change: "-1", icon: CheckSquare, color: "text-[hsl(var(--priority-high))]" },
  { label: "Outstanding Invoices", value: "£42,800", change: "4 unpaid", icon: Receipt, color: "text-[hsl(var(--stage-proposal))]" },
];

const pipelineData = [
  { stage: "Lead", value: 40000, color: "hsl(var(--stage-lead))" },
  { stage: "Qualified", value: 110000, color: "hsl(var(--stage-qualified))" },
  { stage: "Proposal", value: 117000, color: "hsl(var(--stage-proposal))" },
  { stage: "Negotiation", value: 48000, color: "hsl(var(--stage-negotiation))" },
  { stage: "Verbal", value: 38000, color: "hsl(var(--stage-verbal))" },
];

const upcomingSessions = [
  { title: "NHS Blood & Transplant - Manager Training", client: "NHS Blood & Transplant", date: "Mar 10", facilitator: "RF", duration: "3 hours" },
  { title: "Lloyds Bank - Executive Briefing", client: "Lloyds Bank", date: "Mar 11", facilitator: "RF", duration: "3 hours" },
  { title: "Sky - Gen Z Workshop", client: "Sky", date: "Mar 12", facilitator: "CF", duration: "90 min" },
  { title: "TfL - Champions Programme", client: "Transport for London", date: "Mar 14", facilitator: "RF", duration: "3 hours" },
];

const recentActivity = [
  { action: "Moved deal to Proposal Sent", entity: "IBM Neuroinclusion Strategy", user: "Rich", initials: "RF", time: "2 hours ago" },
  { action: "Delivered session", entity: "Google UK - ADHD Workshop", user: "Rich", initials: "RF", time: "Yesterday" },
  { action: "New deal created", entity: "PayPal Manager Training — £28,000", user: "Charlie", initials: "CF", time: "Yesterday" },
  { action: "Invoice paid", entity: "INV-2026-041 — Aviva — £15,200", user: "System", initials: "SY", time: "2 days ago" },
  { action: "Proposal accepted", entity: "NHS Yorkshire Champions Programme", user: "Charlie", initials: "CF", time: "3 days ago" },
];

export default function Dashboard() {
  return (
    <>
      <div className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to Neurodiversity Global Hub</p>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} fontSize={11} />
                  <YAxis type="category" dataKey="stage" width={80} fontSize={11} />
                  <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} />
                  <Bar dataKey="value" radius={4}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
              <div className="space-y-3">
                {upcomingSessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-xs text-muted-foreground">Mar</p>
                      <p className="text-lg font-bold">{s.date.split(" ")[1]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.client} • {s.duration}</p>
                    </div>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{s.facilitator}</AvatarFallback>
                    </Avatar>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{item.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{item.user}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-sm font-medium">{item.entity}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
