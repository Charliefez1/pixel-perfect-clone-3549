import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin } from "lucide-react";

const meetings = [
  { id: "1", title: "NHS Yorkshire Discovery Call", client: "NHS Yorkshire", date: "Mar 10, 2026", time: "10:00 AM", duration: "1h", location: "Zoom", status: "upcoming" },
  { id: "2", title: "Barclays Workshop Prep", client: "Barclays", date: "Mar 11, 2026", time: "2:00 PM", duration: "45m", location: "Teams", status: "upcoming" },
  { id: "3", title: "Deloitte Project Review", client: "Deloitte", date: "Mar 12, 2026", time: "11:00 AM", duration: "1h 30m", location: "On-site", status: "upcoming" },
  { id: "4", title: "AstraZeneca Final Presentation", client: "AstraZeneca", date: "Mar 8, 2026", time: "3:00 PM", duration: "2h", location: "Hybrid", status: "today" },
];

export default function Meetings() {
  return (
    <>
      <PageHeader title="Meetings" searchPlaceholder="Search meetings..." actionLabel="New Meeting" />
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4 max-w-3xl">
          {meetings.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{m.client}</p>
                  </div>
                  <Badge variant={m.status === "today" ? "default" : "secondary"}>{m.status}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{m.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{m.time} ({m.duration})</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
