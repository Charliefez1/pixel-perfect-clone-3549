import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDeals, Deal } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays } from "date-fns";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDialogs } from "@/App";

const stages = [
  { id: "lead", label: "Lead", color: "bg-[hsl(var(--stage-lead))]" },
  { id: "qualified", label: "Qualified", color: "bg-[hsl(var(--stage-qualified))]" },
  { id: "proposal", label: "Proposal Sent", color: "bg-[hsl(var(--stage-proposal))]" },
  { id: "negotiation", label: "Negotiation", color: "bg-[hsl(var(--stage-negotiation))]" },
  { id: "verbal", label: "Verbal Yes", color: "bg-[hsl(var(--stage-verbal))]" },
  { id: "won", label: "Won", color: "bg-[hsl(var(--stage-won))]" },
  { id: "lost", label: "Lost", color: "bg-[hsl(var(--stage-lost))]" },
];

function getDaysInStage(deal: Deal): number {
  return differenceInDays(new Date(), new Date(deal.stage_entered_at));
}

export default function Deals() {
  const { data: deals, isLoading } = useDeals();
  const [view, setView] = useState<ViewMode>("board");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const { openCreateDeal } = useDialogs();

  return (
    <>
      <PageHeader title="Deals" searchPlaceholder="Search deals..." actionLabel="New Deal" onAction={openCreateDeal}>
        <ViewToggle value={view} onChange={setView} />
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-72 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : view === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
            {stages.map((stage) => {
              const stageDeals = deals?.filter((d) => d.stage === stage.id) || [];
              const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
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
                      <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDeal(deal)}>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-sm font-medium leading-tight">{deal.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {deal.organisations?.name || "No organisation"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-primary">
                              £{(deal.value || 0).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {getDaysInStage(deal)}d
                              </span>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {deal.contacts
                                    ? `${deal.contacts.first_name[0]}${deal.contacts.last_name[0]}`
                                    : "?"
                                  }
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={openCreateDeal}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add deal
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {deals?.map((deal) => (
              <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDeal(deal)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.organisations?.name || "No organisation"}</p>
                  </div>
                  <Badge variant="secondary">{stages.find(s => s.id === deal.stage)?.label}</Badge>
                  <span className="text-sm font-semibold text-primary w-24 text-right">£{(deal.value || 0).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">{getDaysInStage(deal)}d</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Deal</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Days in Stage</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals?.map((deal) => (
                  <TableRow key={deal.id} className="cursor-pointer" onClick={() => setSelectedDeal(deal)}>
                    <TableCell className="pl-6 font-medium">{deal.title}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.organisations?.name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{stages.find(s => s.id === deal.stage)?.label}</Badge></TableCell>
                    <TableCell className="font-semibold text-primary">£{(deal.value || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{getDaysInStage(deal)}d</TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selectedDeal && (
        <DetailPanel
          open={!!selectedDeal}
          onOpenChange={() => setSelectedDeal(null)}
          title={selectedDeal.title}
          badge={{ label: stages.find(s => s.id === selectedDeal.stage)?.label || selectedDeal.stage }}
          fields={[
            { label: "Organisation", value: selectedDeal.organisations?.name },
            { label: "Value", value: `£${(selectedDeal.value || 0).toLocaleString()}` },
            { label: "Probability", value: `${selectedDeal.probability || 0}%` },
            { label: "Contact", value: selectedDeal.contacts ? `${selectedDeal.contacts.first_name} ${selectedDeal.contacts.last_name}` : undefined },
            { label: "Expected Close", value: selectedDeal.expected_close_date },
            { label: "Days in Stage", value: `${getDaysInStage(selectedDeal)} days` },
            { label: "Notes", value: selectedDeal.notes },
          ]}
        />
      )}
    </>
  );
}
