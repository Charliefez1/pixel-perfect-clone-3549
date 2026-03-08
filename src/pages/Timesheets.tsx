import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Timesheets() {
  const { data: entries, isLoading } = useTimeEntries();
  const { data: projects } = useProjects();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const projectRows = useMemo(() => {
    if (!entries || !projects) return [];
    const weekEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    });
    const byProject = new Map<string, { name: string; days: number[] }>();
    weekEntries.forEach(e => {
      const pid = e.project_id || "unassigned";
      const name = e.projects?.name || "Unassigned";
      if (!byProject.has(pid)) byProject.set(pid, { name, days: [0, 0, 0, 0, 0, 0, 0] });
      const row = byProject.get(pid)!;
      const dayIdx = weekDays.findIndex(d => isSameDay(d, new Date(e.date)));
      if (dayIdx >= 0) row.days[dayIdx] += e.duration_minutes;
    });
    return Array.from(byProject.values());
  }, [entries, projects, weekStart, weekEnd, weekDays]);

  const dailyTotals = weekDays.map((_, i) => projectRows.reduce((s, r) => s + r.days[i], 0));
  const weekTotal = dailyTotals.reduce((s, v) => s + v, 0);

  const formatHours = (mins: number) => {
    if (mins === 0) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}` : `${m}m`;
  };

  return (
    <>
      <PageHeader title="Timesheets" searchPlaceholder="Search timesheets..." />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold">{format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}</h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">{formatHours(weekTotal)} total</Badge>
            <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>This Week</Button>
          </div>
        </div>

        {/* Timesheet grid */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : projectRows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Clock className="h-6 w-6 text-primary" /></div>
                <p>No time logged this week. Track time on the Time Tracking page.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-48">Project</TableHead>
                    {weekDays.map((d, i) => (
                      <TableHead key={i} className="text-center w-20">
                        <div className="text-xs text-muted-foreground">{format(d, "EEE")}</div>
                        <div className={cn("text-sm", isSameDay(d, new Date()) && "text-primary font-bold")}>{format(d, "d")}</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center w-24">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectRows.map((row, ri) => (
                    <TableRow key={ri}>
                      <TableCell className="pl-6 font-medium text-sm">{row.name}</TableCell>
                      {row.days.map((mins, di) => (
                        <TableCell key={di} className="text-center text-sm text-muted-foreground">{formatHours(mins)}</TableCell>
                      ))}
                      <TableCell className="text-center text-sm font-semibold">{formatHours(row.days.reduce((s, v) => s + v, 0))}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="pl-6 text-sm">Daily Total</TableCell>
                    {dailyTotals.map((t, i) => (
                      <TableCell key={i} className="text-center text-sm">{formatHours(t)}</TableCell>
                    ))}
                    <TableCell className="text-center text-sm font-bold text-primary">{formatHours(weekTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
