import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Clock } from "lucide-react";

const stages = [
  { id: "lead", label: "Lead", color: "bg-[hsl(var(--stage-lead))]" },
  { id: "qualified", label: "Qualified", color: "bg-[hsl(var(--stage-qualified))]" },
  { id: "proposal", label: "Proposal Sent", color: "bg-[hsl(var(--stage-proposal))]" },
  { id: "negotiation", label: "Negotiation", color: "bg-[hsl(var(--stage-negotiation))]" },
  { id: "verbal", label: "Verbal Yes", color: "bg-[hsl(var(--stage-verbal))]" },
  { id: "won", label: "Won", color: "bg-[hsl(var(--stage-won))]" },
  { id: "lost", label: "Lost", color: "bg-[hsl(var(--stage-lost))]" },
];

interface Deal {
  id: string;
  title: string;
  org: string;
  value: number;
  owner: string;
  daysInStage: number;
  stage: string;
}

const mockDeals: Deal[] = [
  { id: "1", title: "Leadership Programme", org: "Barclays", value: 45000, owner: "Charlie", daysInStage: 3, stage: "proposal" },
  { id: "2", title: "Wellbeing Workshop Series", org: "Deloitte", value: 28000, owner: "Rich", daysInStage: 7, stage: "negotiation" },
  { id: "3", title: "Executive Coaching", org: "NHS Yorkshire", value: 15000, owner: "Charlie", daysInStage: 1, stage: "lead" },
  { id: "4", title: "Team Resilience", org: "AstraZeneca", value: 52000, owner: "Rich", daysInStage: 14, stage: "qualified" },
  { id: "5", title: "Mental Health First Aid", org: "Unilever", value: 18500, owner: "Charlie", daysInStage: 5, stage: "lead" },
  { id: "6", title: "Stress Management Programme", org: "HSBC", value: 35000, owner: "Rich", daysInStage: 2, stage: "verbal" },
  { id: "7", title: "Burnout Prevention", org: "PwC", value: 22000, owner: "Charlie", daysInStage: 10, stage: "proposal" },
  { id: "8", title: "Neuroscience of Performance", org: "Google UK", value: 68000, owner: "Rich", daysInStage: 21, stage: "won" },
  { id: "9", title: "Wellbeing Strategy", org: "Sainsbury's", value: 12000, owner: "Charlie", daysInStage: 45, stage: "lost" },
  { id: "10", title: "Sleep & Recovery Workshop", org: "Meta UK", value: 9500, owner: "Rich", daysInStage: 4, stage: "qualified" },
];

function DealCard({ deal }: { deal: Deal }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-semibold leading-tight">{deal.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>{deal.org}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">£{deal.value.toLocaleString()}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{deal.owner}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{deal.daysInStage}d</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pipeline() {
  return (
    <>
      <TopBar title="Pipeline" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
          {stages.map((stage) => {
            const stageDeals = mockDeals.filter((d) => d.stage === stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col">
                {/* Stage Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {stageDeals.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  £{totalValue.toLocaleString()}
                </p>
                {/* Cards */}
                <div className="space-y-2 flex-1">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
