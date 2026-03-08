import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Clock, MapPin, Video } from "lucide-react";

const meetings = [
  { id: "1", title: "NHS Blood & Transplant - Manager Training Session", client: "NHS Blood & Transplant", date: "Mar 10, 2026", time: "10:00 AM", duration: "3 hours", location: "On-site (Leeds)", facilitator: "RF", type: "session" },
  { id: "2", title: "Lloyds Bank - Executive Briefing", client: "Lloyds Bank", date: "Mar 11, 2026", time: "2:00 PM", duration: "3 hours", location: "Hybrid (London)", facilitator: "RF", type: "session" },
  { id: "3", title: "Sky - Gen Z Workshop", client: "Sky", date: "Mar 12, 2026", time: "11:00 AM", duration: "90 min", location: "Zoom", facilitator: "CF", type: "session" },
  { id: "4", title: "PayPal - Discovery Call", client: "PayPal", date: "Mar 13, 2026", time: "3:00 PM", duration: "30 min", location: "Zoom", facilitator: "CF", type: "discovery" },
  { id: "5", title: "TfL - Champions Programme (Session 4)", client: "Transport for London", date: "Mar 14, 2026", time: "9:30 AM", duration: "3 hours", location: "On-site (London)", facilitator: "RF", type: "session" },
  { id: "6", title: "IBM - Strategy Review Meeting", client: "IBM", date: "Mar 15, 2026", time: "10:00 AM", duration: "2 hours", location: "Teams", facilitator: "RF", type: "consultancy" },
  { id: "7", title: "University of Cambridge - Scoping Call", client: "University of Cambridge", date: "Mar 17, 2026", time: "11:00 AM", duration: "45 min", location: "Zoom", facilitator: "RF", type: "discovery" },
];

const typeStyles: Record<string, string> = {
  session: "bg-primary/20 text-primary",
  discovery: "bg-[hsl(var(--stage-lead))]/20 text-[hsl(var(--stage-lead))]",
  consultancy: "bg-[hsl(var(--stage-negotiation))]/20 text-[hsl(var(--stage-negotiation))]",
};

export default function Meetings() {
  return (
    <>
      <PageHeader title="Sessions & Meetings" searchPlaceholder="Search..." actionLabel="New Meeting" />
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4 max-w-4xl">
          {meetings.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-center shrink-0 w-14 py-2 rounded-lg bg-primary/10">
                      <p className="text-xs text-muted-foreground">{m.date.split(",")[0].split(" ")[0]}</p>
                      <p className="text-xl font-bold text-primary">{m.date.split(" ")[1].replace(",", "")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{m.title}</p>
                      <p className="text-sm text-muted-foreground">{m.client}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{m.time} ({m.duration})</span>
                        <span className="flex items-center gap-1">
                          {m.location.includes("Zoom") || m.location.includes("Teams") ? (
                            <Video className="h-3.5 w-3.5" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5" />
                          )}
                          {m.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={typeStyles[m.type]}>{m.type}</Badge>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{m.facilitator}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
