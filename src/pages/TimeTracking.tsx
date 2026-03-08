import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock } from "lucide-react";

const entries = [
  { id: "1", task: "Proposal writing", project: "NHS Yorkshire", duration: "2h 15m", date: "Today" },
  { id: "2", task: "Client call", project: "Barclays", duration: "45m", date: "Today" },
  { id: "3", task: "Workshop preparation", project: "Deloitte", duration: "3h 30m", date: "Yesterday" },
  { id: "4", task: "Session delivery", project: "AstraZeneca", duration: "4h", date: "Yesterday" },
];

export default function TimeTracking() {
  return (
    <>
      <PageHeader title="Time Tracking" searchPlaceholder="Search entries..." />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Timer
                </Button>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="What are you working on?"
                    className="w-full bg-transparent border-0 text-lg focus:outline-none"
                  />
                </div>
                <span className="text-2xl font-mono text-muted-foreground">00:00:00</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {entries.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{e.task}</p>
                    <p className="text-sm text-muted-foreground">{e.project}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{e.date}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {e.duration}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
