import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, CheckSquare } from "lucide-react";
import { ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Tooltip } from "recharts";

interface Props {
  neuroData: Array<{ name: string; value: number; fill: string }>;
  completionRate: number;
  doneTasks: number;
  totalTasks: number;
}

export default function DashboardCharts({ neuroData, completionRate, doneTasks, totalTasks }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" /> NEURO Phase Distribution
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" /> Task Completion
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
    </div>
  );
}
