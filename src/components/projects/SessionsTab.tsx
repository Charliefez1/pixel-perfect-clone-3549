import { useSessions } from "@/hooks/useSessions";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Video, MapPin } from "lucide-react";

interface Props {
  projectId: string;
  type?: "workshop" | "meeting";
}

export function SessionsTab({ projectId, type }: Props) {
  const { data: sessions, isLoading } = useSessions();
  const projectSessions = sessions?.filter((s) => {
    if (s.project_id !== projectId) return false;
    if (type && 'session_type' in s) return s.session_type === type;
    return true;
  }) || [];

  const label = type === "workshop" ? "workshops" : type === "meeting" ? "meetings" : "sessions";

  if (isLoading) {
    return <p className="text-sm text-muted-foreground animate-pulse">Loading {label}...</p>;
  }

  if (!projectSessions.length) {
    return <p className="text-sm text-muted-foreground">No {label} linked to this project.</p>;
  }

  const isWorkshop = type === "workshop";

  return (
    <div className="space-y-2">
      {projectSessions.map((s) => {
        const isPast = s.session_date && new Date(s.session_date) < new Date();
        const isOnline = s.location?.toLowerCase().includes("zoom") || s.location?.toLowerCase().includes("teams") || s.location?.toLowerCase().includes("online");
        return (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-md border">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.title}</p>
              {s.session_date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(s.session_date).toLocaleDateString("en-GB")} · {s.duration_minutes}min
                </p>
              )}
            </div>
            {s.location && (
              <Badge variant="secondary" className="text-[9px] gap-1">
                {isOnline ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {s.location}
              </Badge>
            )}
            {isWorkshop && (
              <Badge variant="default" className="text-[9px]">Workshop</Badge>
            )}
            {isPast && <Badge variant="outline" className="text-[9px]">Past</Badge>}
          </div>
        );
      })}
    </div>
  );
}
