import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessions, Session } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarClock, Clock, MapPin, Video, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Scheduling() {
  const { data: sessions, isLoading } = useSessions();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const upcomingSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter(s => s.session_date && new Date(s.session_date) >= new Date())
      .sort((a, b) => new Date(a.session_date!).getTime() - new Date(b.session_date!).getTime())
      .slice(0, 10);
  }, [sessions]);

  const weekSessions = useMemo(() => {
    if (!sessions) return new Map<string, Session[]>();
    const map = new Map<string, Session[]>();
    weekDays.forEach(d => map.set(d.toISOString().split("T")[0], []));
    sessions.forEach(s => {
      if (!s.session_date) return;
      const dateKey = new Date(s.session_date).toISOString().split("T")[0];
      if (map.has(dateKey)) map.get(dateKey)!.push(s);
    });
    return map;
  }, [sessions, weekDays]);

  const totalThisWeek = Array.from(weekSessions.values()).reduce((s, arr) => s + arr.length, 0);

  const copyBookingLink = () => {
    toast.success("Booking link copied (placeholder — booking page coming soon)");
  };

  return (
    <>
      <PageHeader title="Scheduling" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">This Week</p>{isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalThisWeek} sessions</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Upcoming</p>{isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{upcomingSessions.length}</p>}</CardContent></Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Booking Link</p><p className="text-sm font-medium">Share with clients</p></div>
              <Button variant="outline" size="sm" className="gap-2" onClick={copyBookingLink}><Copy className="h-3.5 w-3.5" /> Copy Link</Button>
            </CardContent>
          </Card>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold">{format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}</h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>Today</Button>
        </div>

        {/* Week calendar grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-3">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map(day => {
              const dateKey = day.toISOString().split("T")[0];
              const daySessions = weekSessions.get(dateKey) || [];
              const isToday = isSameDay(day, new Date());
              return (
                <Card key={dateKey} className={cn("min-h-[160px]", isToday && "ring-2 ring-primary")}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-medium", isToday ? "text-primary" : "text-muted-foreground")}>{format(day, "EEE")}</span>
                      <span className={cn("text-lg font-bold", isToday && "text-primary")}>{format(day, "d")}</span>
                    </div>
                    {daySessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sessions</p>
                    ) : (
                      daySessions.map(s => {
                        const isOnline = s.location?.toLowerCase().includes("zoom") || s.location?.toLowerCase().includes("teams");
                        return (
                          <div key={s.id} className={cn("rounded-md p-2 space-y-1", (s as any).session_type === "workshop" ? "bg-primary/10" : "bg-primary/5")}>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium truncate">{s.title}</p>
                              <Badge variant={(s as any).session_type === "workshop" ? "default" : "secondary"} className="text-[8px] h-4 px-1">
                                {(s as any).session_type === "workshop" ? "W" : "M"}
                              </Badge>
                            </div>
                            {s.session_date && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(parseISO(s.session_date), "h:mm a")}</p>}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upcoming list */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Upcoming Sessions</h2>
          {!upcomingSessions.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No upcoming sessions scheduled.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-3 flex items-center gap-4">
                    {s.session_date && (
                      <div className="text-center shrink-0 w-12 py-1 rounded-lg bg-primary/10">
                        <p className="text-[10px] text-muted-foreground">{format(parseISO(s.session_date), "MMM")}</p>
                        <p className="text-lg font-bold text-primary">{format(parseISO(s.session_date), "d")}</p>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.projects?.organisations?.name || s.projects?.name || "No project"}</p>
                    </div>
                    {s.session_date && <span className="text-xs text-muted-foreground">{format(parseISO(s.session_date), "h:mm a")}</span>}
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
