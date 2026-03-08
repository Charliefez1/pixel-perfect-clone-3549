import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const stages = [
  { id: "lead", label: "Lead", color: "bg-[hsl(var(--stage-lead))]" },
  { id: "qualified", label: "Qualified", color: "bg-[hsl(var(--stage-qualified))]" },
  { id: "proposal", label: "Proposal Sent", color: "bg-[hsl(var(--stage-proposal))]" },
  { id: "negotiation", label: "Negotiation", color: "bg-[hsl(var(--stage-negotiation))]" },
  { id: "verbal", label: "Verbal Yes", color: "bg-[hsl(var(--stage-verbal))]" },
  { id: "won", label: "Won", color: "bg-[hsl(var(--stage-won))]" },
  { id: "lost", label: "Lost", color: "bg-[hsl(var(--stage-lost))]" },
];

const mockDeals = [
  { id: "1", title: "NHS Yorkshire Leadership Programme", value: 35000, org: "NHS Yorkshire", contact: "Sarah Mitchell", stage: "proposal", owner: "CW", daysInStage: 4 },
  { id: "2", title: "Barclays Resilience Workshop", value: 45000, org: "Barclays", contact: "James Porter", stage: "negotiation", owner: "RB", daysInStage: 2 },
  { id: "3", title: "Deloitte Wellbeing Series", value: 28000, org: "Deloitte", contact: "Emma Chen", stage: "qualified", owner: "CW", daysInStage: 7 },
  { id: "4", title: "AstraZeneca Team Performance", value: 52000, org: "AstraZeneca", contact: "Tom Williams", stage: "verbal", owner: "RB", daysInStage: 1 },
  { id: "5", title: "Unilever Mental Health First Aid", value: 18500, org: "Unilever", contact: "Lucy Taylor", stage: "lead", owner: "CW", daysInStage: 12 },
  { id: "6", title: "Google UK Workshop", value: 62000, org: "Google UK", contact: "David Lee", stage: "won", owner: "RB", daysInStage: 0 },
];

export default function Deals() {
  return (
    <>
      <PageHeader title="Deals" searchPlaceholder="Search deals..." actionLabel="New Deal" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
          {stages.map((stage) => {
            const stageDeals = mockDeals.filter((d) => d.stage === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={stage.id} className="flex-shrink-0 w-72 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-sm font-semibold">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{stageDeals.length}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">£{stageTotal.toLocaleString()}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm font-medium leading-tight">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.org}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">£{deal.value.toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{deal.daysInStage}d</span>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{deal.owner}</AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add deal
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
