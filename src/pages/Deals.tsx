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
  // Leads
  { id: "1", title: "PayPal - Manager Training Programme", value: 28000, org: "PayPal", contact: "Emma Richards", stage: "lead", owner: "CF", daysInStage: 5, service: "Training" },
  { id: "2", title: "University of Cambridge - Awareness Sessions", value: 12000, org: "University of Cambridge", contact: "Dr James Liu", stage: "lead", owner: "RF", daysInStage: 8, service: "Training" },
  
  // Qualified
  { id: "3", title: "Royal Mail - Champions Programme", value: 45000, org: "Royal Mail", contact: "Sarah Thompson", stage: "qualified", owner: "RF", daysInStage: 4, service: "Training" },
  { id: "4", title: "Elastic - Neuroinclusion Consultancy", value: 65000, org: "Elastic", contact: "Mike Chen", stage: "qualified", owner: "CF", daysInStage: 6, service: "Consultancy" },
  
  // Proposal
  { id: "5", title: "IBM - Strategic Neuroinclusion Review", value: 85000, org: "IBM", contact: "David Park", stage: "proposal", owner: "RF", daysInStage: 3, service: "Consultancy" },
  { id: "6", title: "NHS Blood & Transplant - Line Manager Training", value: 32000, org: "NHS Blood & Transplant", contact: "Lisa Morgan", stage: "proposal", owner: "RF", daysInStage: 7, service: "Training" },
  
  // Negotiation
  { id: "7", title: "Lloyds Bank - Executive Briefing Series", value: 48000, org: "Lloyds Bank", contact: "Tom Harrison", stage: "negotiation", owner: "RF", daysInStage: 2, service: "Training" },
  
  // Verbal
  { id: "8", title: "Sky - Gen Z Neurodiversity Programme", value: 38000, org: "Sky", contact: "Rachel Green", stage: "verbal", owner: "CF", daysInStage: 1, service: "Training" },
  
  // Won
  { id: "9", title: "Google UK - ADHD Workshop Series", value: 42000, org: "Google UK", contact: "Anna Williams", stage: "won", owner: "RF", daysInStage: 0, service: "Training" },
  { id: "10", title: "TfL - Champions & Advocate Programme", value: 55000, org: "Transport for London", contact: "Mark Davies", stage: "won", owner: "RF", daysInStage: 0, service: "Training" },
];

const serviceColors: Record<string, string> = {
  Training: "bg-primary/20 text-primary",
  Consultancy: "bg-[hsl(var(--stage-negotiation))]/20 text-[hsl(var(--stage-negotiation))]",
  Coaching: "bg-[hsl(var(--stage-qualified))]/20 text-[hsl(var(--stage-qualified))]",
};

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
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground flex-1">{deal.org}</p>
                          <Badge className={`${serviceColors[deal.service]} text-[9px] px-1.5`}>{deal.service}</Badge>
                        </div>
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
