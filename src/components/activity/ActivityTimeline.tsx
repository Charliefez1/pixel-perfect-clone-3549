import { useState } from "react";
import { useActivities, useCreateActivity, Activity } from "@/hooks/useActivities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Calendar, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const activityTypes = [
  { value: "note", label: "Note", icon: FileText },
  { value: "email_sent", label: "Email Sent", icon: Mail },
  { value: "email_received", label: "Email Received", icon: Mail },
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Calendar },
];

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  email_sent: Mail,
  email_received: Mail,
  call: Phone,
  meeting: Calendar,
};

const typeColors: Record<string, string> = {
  note: "bg-muted text-muted-foreground",
  email_sent: "bg-blue-100 text-blue-700",
  email_received: "bg-green-100 text-green-700",
  call: "bg-amber-100 text-amber-700",
  meeting: "bg-purple-100 text-purple-700",
};

interface Props {
  entityType: "organisation" | "contact" | "deal";
  entityId: string;
  organisationId?: string;
  contactId?: string;
  dealId?: string;
}

export function ActivityTimeline({ entityType, entityId, organisationId, contactId, dealId }: Props) {
  const { data: activities, isLoading } = useActivities(entityType, entityId);
  const createActivity = useCreateActivity();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    try {
      await createActivity.mutateAsync({
        type,
        subject: subject.trim(),
        body: body.trim() || null,
        source: "manual",
        activity_date: new Date().toISOString(),
        organisation_id: organisationId || (entityType === "organisation" ? entityId : null),
        contact_id: contactId || (entityType === "contact" ? entityId : null),
        deal_id: dealId || (entityType === "deal" ? entityId : null),
        created_by: null,
      });
      toast.success("Activity logged");
      setSubject("");
      setBody("");
      setShowForm(false);
    } catch {
      toast.error("Failed to log activity");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Activity Timeline</span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3 mr-1" /> Log Activity
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-xs" />
          <Textarea placeholder="Details (optional)" value={body} onChange={(e) => setBody(e.target.value)} rows={2} className="text-xs" />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={createActivity.isPending || !subject.trim()}>
              {createActivity.isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : !activities?.length ? (
        <p className="text-xs text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => {
            const Icon = typeIcons[a.type] || MessageSquare;
            return (
              <div key={a.id} className="flex items-start gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeColors[a.type] || "bg-muted"}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{a.subject || a.type}</p>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{a.type.replace("_", " ")}</Badge>
                  </div>
                  {a.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(a.activity_date), "dd/MM/yyyy HH:mm")}
                    {a.source !== "manual" && ` · ${a.source}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
