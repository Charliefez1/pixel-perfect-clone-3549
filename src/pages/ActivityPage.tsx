import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const activities = [
  { action: "Moved deal to Proposal Sent", entity: "Barclays Leadership Programme", user: "Charlie", initials: "CW", time: "2 hours ago", type: "deal" },
  { action: "Added new contact", entity: "Sarah Mitchell (NHS Yorkshire)", user: "Rich", initials: "RB", time: "4 hours ago", type: "contact" },
  { action: "Completed task", entity: "Prepare workshop materials", user: "Charlie", initials: "CW", time: "Yesterday", type: "task" },
  { action: "Invoice paid", entity: "INV-2024-041 — £10,200", user: "System", initials: "SY", time: "Yesterday", type: "invoice" },
  { action: "Session delivered", entity: "Deloitte Resilience Workshop", user: "Rich", initials: "RB", time: "2 days ago", type: "session" },
  { action: "New deal created", entity: "Unilever Mental Health First Aid — £18,500", user: "Charlie", initials: "CW", time: "3 days ago", type: "deal" },
  { action: "Project status changed to Active", entity: "AstraZeneca Team Performance", user: "Rich", initials: "RB", time: "4 days ago", type: "project" },
  { action: "Comment added", entity: "NHS Yorkshire proposal needs revision", user: "Charlie", initials: "CW", time: "5 days ago", type: "comment" },
];

const typeColors: Record<string, string> = {
  deal: "bg-[hsl(var(--stage-proposal))]",
  contact: "bg-[hsl(var(--stage-lead))]",
  task: "bg-primary",
  invoice: "bg-[hsl(var(--stage-won))]",
  session: "bg-[hsl(var(--stage-qualified))]",
  project: "bg-[hsl(var(--stage-negotiation))]",
  comment: "bg-muted",
};

export default function ActivityPage() {
  return (
    <>
      <TopBar title="Activity" />
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {activities.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{item.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{item.user}</span>
                      {" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-sm font-medium mt-0.5">{item.entity}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
