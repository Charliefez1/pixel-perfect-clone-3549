import { useActivities } from "@/hooks/useActivities";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, StickyNote } from "lucide-react";

const typeIcons: Record<string, typeof Mail> = {
  email_sent: Mail,
  email_received: MailOpen,
  note: StickyNote,
};

export function ActivityTab({ organisationId }: { organisationId?: string | null }) {
  const { data: activities, isLoading } = useActivities(
    organisationId ? "organisation" : undefined,
    organisationId || undefined
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground animate-pulse">Loading activity...</p>;
  }

  const recent = activities?.slice(0, 20) || [];

  if (!recent.length) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {recent.map((a) => {
        const Icon = typeIcons[a.type] || StickyNote;
        return (
          <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-md border">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.subject || a.type}</p>
              {a.body && <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(a.activity_date).toLocaleDateString("en-GB")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
