import { useSessions } from "@/hooks/useSessions";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

export function SessionsTab({ projectId }: { projectId: string }) {
  const { data: sessions } = useSessions();
  const projectSessions = sessions?.filter((s) => s.project_id === projectId) || [];

  if (!projectSessions.length) {
    return <p className="text-sm text-muted-foreground">No sessions linked to this project.</p>;
  }

  return (
    <div className="space-y-2">
      {projectSessions.map((s) => {
        const isPast = s.session_date && new Date(s.session_date) < new Date();
        return (
          <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-md border">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.title}</p>
              {s.session_date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(s.session_date).toLocaleDateString("en-GB")} · {s.duration_minutes}min
                </p>
              )}
            </div>
            {s.location && <Badge variant="secondary" className="text-[9px]">{s.location}</Badge>}
            {isPast && <Badge variant="outline" className="text-[9px]">Past</Badge>}
          </div>
        );
      })}
    </div>
  );
}
