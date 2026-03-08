import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MapPin, Video } from "lucide-react";
import { useSessions, Session } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { useDialogs } from "@/App";

export default function Meetings() {
  const { data: sessions, isLoading } = useSessions();
  const [selected, setSelected] = useState<Session | null>(null);
  const { openCreateSession } = useDialogs();

  return (
    <>
      <PageHeader title="Sessions & Meetings" searchPlaceholder="Search..." actionLabel="New Session" onAction={openCreateSession} />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-4 max-w-4xl">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !sessions?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No sessions scheduled. Add your first session to get started.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {sessions.map((s) => {
              const sessionDate = s.session_date ? parseISO(s.session_date) : null;
              const isOnline = s.location?.toLowerCase().includes("zoom") ||
                               s.location?.toLowerCase().includes("teams") ||
                               s.location?.toLowerCase().includes("online");

              return (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(s)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {sessionDate && (
                          <div className="text-center shrink-0 w-14 py-2 rounded-lg bg-primary/10">
                            <p className="text-xs text-muted-foreground">{format(sessionDate, "MMM")}</p>
                            <p className="text-xl font-bold text-primary">{format(sessionDate, "d")}</p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="font-medium">{s.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {s.projects?.organisations?.name || s.projects?.name || "No project"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {sessionDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(sessionDate, "h:mm a")} ({s.duration_minutes || 60} min)
                              </span>
                            )}
                            {s.location && (
                              <span className="flex items-center gap-1">
                                {isOnline ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                                {s.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">session</Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {s.facilitator_id ? "F" : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.title}
          fields={[
            { label: "Project", value: selected.projects?.name },
            { label: "Organisation", value: selected.projects?.organisations?.name },
            { label: "Date", value: selected.session_date ? format(parseISO(selected.session_date), "PPP 'at' p") : undefined },
            { label: "Duration", value: `${selected.duration_minutes || 60} minutes` },
            { label: "Location", value: selected.location },
            { label: "Notes", value: selected.notes },
          ]}
        />
      )}
    </>
  );
}
