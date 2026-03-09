import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useDeals, Deal, useUpdateDeal } from "@/hooks/useDeals";
import { useInvoices } from "@/hooks/useInvoices";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useLogActivity } from "@/hooks/useActivityLog";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDialogs } from "@/App";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { EntityDocuments } from "@/components/documents/EntityDocuments";

const stages = [
  { id: "lead", label: "Lead", color: "bg-slate-400" },
  { id: "qualified", label: "Qualified", color: "bg-blue-400" },
  { id: "proposal", label: "Proposal Sent", color: "bg-amber-400" },
  { id: "negotiation", label: "Negotiation", color: "bg-purple-400" },
  { id: "verbal", label: "Verbal Yes", color: "bg-cyan-400" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-400" },
];

const serviceTypeColors: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-700",
  programme: "bg-purple-100 text-purple-700",
  coaching: "bg-green-100 text-green-700",
  keynote: "bg-orange-100 text-orange-700",
  audit: "bg-teal-100 text-teal-700",
  sera_pilot: "bg-pink-100 text-pink-700",
};

function getDaysInStage(deal: Deal): number {
  return differenceInDays(new Date(), new Date(deal.stage_entered_at));
}

function isStale(deal: Deal): boolean {
  return getDaysInStage(deal) > 14 && !["won", "lost"].includes(deal.stage);
}

export default function Deals() {
  const { data: deals, isLoading } = useDeals();
  const [view, setView] = useState<ViewMode>("board");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const { openCreateDeal } = useDialogs();
  const updateDeal = useUpdateDeal();
  const logActivity = useLogActivity();
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link: auto-open deal from ?open=DEAL_ID
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId && deals) {
      const deal = deals.find((d) => d.id === openId);
      if (deal) {
        setSelectedDeal(deal);
        searchParams.delete("open");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [deals, searchParams, setSearchParams]);

  const totalPipeline = deals?.filter((d) => !["won", "lost"].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0) || 0;
  const weightedPipeline = deals?.filter((d) => !["won", "lost"].includes(d.stage)).reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0) || 0;
  const staleDeals = deals?.filter(isStale) || [];

  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const handleDragStart = useCallback((e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dealId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;
    const deal = deals?.find((d) => d.id === dealId);
    if (!deal || deal.stage === stageId) { setDraggedDealId(null); return; }
    
    updateDeal.mutate(
      { id: dealId, stage: stageId as any, stage_entered_at: new Date().toISOString() },
      {
        onSuccess: () => {
          logActivity.mutate({
            entity_type: "deal",
            entity_id: dealId,
            entity_title: deal.title,
            action: "stage_changed",
            metadata: { from: deal.stage, to: stageId },
          });
          toast.success(`Moved "${deal.title}" to ${stages.find(s => s.id === stageId)?.label}`);
        },
      }
    );
    setDraggedDealId(null);
  }, [deals, updateDeal, logActivity]);

  return (
    <>
      <PageHeader title="Deals" searchPlaceholder="Search deals..." actionLabel="New Deal" onAction={openCreateDeal}>
        <ViewToggle value={view} onChange={setView} showCalendar />
      </PageHeader>

      <div className="border-b bg-card/50 px-6 py-3 flex items-center gap-6 text-sm">
        <span>Pipeline: <strong>£{totalPipeline.toLocaleString()}</strong></span>
        <span>Weighted: <strong>£{weightedPipeline.toLocaleString()}</strong></span>
        {staleDeals.length > 0 && (
          <span className="text-amber-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {staleDeals.length} stale deal{staleDeals.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

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
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-14rem)]">
            {stages.map((stage) => {
              const stageDeals = deals?.filter((d) => d.stage === stage.id) || [];
              const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
              return (
                <div
                  key={stage.id}
                  className={cn("flex-shrink-0 w-72 flex flex-col rounded-lg transition-colors", draggedDealId ? "bg-accent/30" : "")}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
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
                      <DealCard key={deal.id} deal={deal} onClick={() => setSelectedDeal(deal)} onDragStart={(e) => handleDragStart(e, deal.id)} />
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
        ) : view === "calendar" ? (
          <Card className="max-w-4xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>
                  ← Prev
                </Button>
                <h3 className="font-semibold">{format(calendarDate, "MMMM yyyy")}</h3>
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>
                  Next →
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array((startDayOfWeek + 6) % 7)].map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {daysInMonth.map((day) => {
                  const dayDeals = deals?.filter((d) => d.expected_close_date && isSameDay(parseISO(d.expected_close_date), day)) || [];
                  return (
                    <div key={day.toISOString()} className="min-h-[80px] border rounded-md p-1">
                      <p className="text-xs text-muted-foreground mb-1">{format(day, "d")}</p>
                      <div className="space-y-0.5">
                        {dayDeals.slice(0, 3).map((deal) => (
                          <div
                            key={deal.id}
                            className={cn("text-[9px] px-1 py-0.5 rounded truncate cursor-pointer", stages.find((s) => s.id === deal.stage)?.color, "text-white")}
                            onClick={() => setSelectedDeal(deal)}
                          >
                            {deal.title}
                          </div>
                        ))}
                        {dayDeals.length > 3 && <p className="text-[9px] text-muted-foreground">+{dayDeals.length - 3} more</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : view === "list" ? (
          <div className="space-y-2">
            {deals?.map((deal) => (
              <Card key={deal.id} className={cn("cursor-pointer hover:shadow-md transition-shadow", isStale(deal) && "border-amber-300")} onClick={() => setSelectedDeal(deal)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.organisations?.name || "No organisation"}</p>
                  </div>
                  {deal.service_type && <Badge className={serviceTypeColors[deal.service_type] || "bg-muted"}>{deal.service_type}</Badge>}
                  <Badge variant="secondary">{stages.find(s => s.id === deal.stage)?.label}</Badge>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-primary">£{(deal.value || 0).toLocaleString()}</span>
                    <p className="text-[10px] text-muted-foreground">£{((deal.value || 0) * (deal.probability || 0) / 100).toLocaleString()} weighted</p>
                  </div>
                  <span className={cn("text-xs w-12 text-right", isStale(deal) ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                    {getDaysInStage(deal)}d
                  </span>
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
                  <TableHead>Service</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Weighted</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals?.map((deal) => (
                  <TableRow key={deal.id} className={cn("cursor-pointer", isStale(deal) && "bg-amber-50")} onClick={() => setSelectedDeal(deal)}>
                    <TableCell className="pl-6 font-medium">{deal.title}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.organisations?.name || "—"}</TableCell>
                    <TableCell>
                      {deal.service_type && <Badge className={serviceTypeColors[deal.service_type] || "bg-muted"} variant="secondary">{deal.service_type}</Badge>}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{stages.find(s => s.id === deal.stage)?.label}</Badge></TableCell>
                    <TableCell className="font-semibold text-primary">£{(deal.value || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">£{((deal.value || 0) * (deal.probability || 0) / 100).toLocaleString()}</TableCell>
                    <TableCell className={isStale(deal) ? "text-amber-600 font-medium" : "text-muted-foreground"}>{getDaysInStage(deal)}d</TableCell>
                    <TableCell>
                      {deal.owner && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary capitalize">{deal.owner[0]}</AvatarFallback>
                        </Avatar>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selectedDeal && (
        <DealDetailPanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </>
  );
}

function DealCard({ deal, onClick, onDragStart }: { deal: Deal; onClick: () => void; onDragStart: (e: React.DragEvent) => void }) {
  const daysInStage = getDaysInStage(deal);
  const stale = isStale(deal);
  const weighted = (deal.value || 0) * (deal.probability || 0) / 100;

  return (
    <Card
      className={cn("cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing", stale && "border-amber-300 bg-amber-50/50")}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight">{deal.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{deal.organisations?.name || "No organisation"}</p>
          </div>
          {deal.owner && (
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary capitalize">{deal.owner[0]}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {deal.service_type && (
            <Badge className={cn("text-[10px]", serviceTypeColors[deal.service_type] || "bg-muted")}>{deal.service_type}</Badge>
          )}
          {(deal as any).package_size && (deal as any).total_workshops > 0 && (
            <Badge variant="secondary" className="text-[9px]">
              {(deal as any).total_workshops} ws · {(deal as any).package_size?.charAt(0).toUpperCase()}{(deal as any).package_size?.slice(1)}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-primary">£{(deal.value || 0).toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground ml-1">(£{weighted.toLocaleString()} weighted)</span>
          </div>
          <span className={cn("text-[10px]", stale ? "text-amber-600 font-medium" : "text-muted-foreground")}>
            {daysInStage}d {stale && "⚠"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DealDetailPanel({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const updateDeal = useUpdateDeal();
  const logActivity = useLogActivity();
  const { data: invoices } = useInvoices();
  const { data: activities } = useActivityLog("deal", deal.id);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    stage: deal.stage,
    value: deal.value?.toString() || "0",
    probability: deal.probability?.toString() || "0",
    owner: deal.owner || "",
    notes: deal.notes || "",
    expected_close_date: deal.expected_close_date || "",
  });

  const dealInvoices = invoices?.filter((inv) => inv.organisation_id === deal.organisation_id) || [];
  const weighted = (deal.value || 0) * (deal.probability || 0) / 100;

  const handleSave = () => {
    const newStage = editValues.stage;
    const stageChanged = newStage !== deal.stage;
    updateDeal.mutate(
      {
        id: deal.id,
        stage: newStage as any,
        value: parseFloat(editValues.value) || 0,
        probability: parseInt(editValues.probability) || 0,
        owner: editValues.owner || null,
        notes: editValues.notes || null,
        expected_close_date: editValues.expected_close_date || null,
        ...(stageChanged ? { stage_entered_at: new Date().toISOString() } : {}),
      },
      {
        onSuccess: () => {
          if (stageChanged) {
            logActivity.mutate({
              entity_type: "deal",
              entity_id: deal.id,
              entity_title: deal.title,
              action: "stage_changed",
              metadata: { from: deal.stage, to: newStage },
            });
          }
          toast.success("Deal updated");
          setEditing(false);
        },
      }
    );
  };

  return (
    <DetailPanel
      open={!!deal}
      onOpenChange={onClose}
      title={deal.title}
      badge={{ label: stages.find(s => s.id === deal.stage)?.label || deal.stage }}
      fields={editing ? [] : [
        { label: "Organisation", value: deal.organisations?.name },
        { label: "Contact", value: deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : undefined },
        { label: "Service Type", value: deal.service_type },
        { label: "Owner", value: deal.owner },
        { label: "Value", value: `£${(deal.value || 0).toLocaleString()}` },
        { label: "Probability", value: `${deal.probability || 0}%` },
        { label: "Weighted Value", value: `£${weighted.toLocaleString()}` },
        { label: "Expected Close", value: deal.expected_close_date ? format(parseISO(deal.expected_close_date), "dd/MM/yyyy") : undefined },
        { label: "Days in Stage", value: `${getDaysInStage(deal)} days` },
        { label: "Notes", value: deal.notes },
      ]}
    >
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Stage</label>
            <Select value={editValues.stage} onValueChange={(v: string) => setEditValues({ ...editValues, stage: v as typeof deal.stage })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Value (£)</label>
              <Input value={editValues.value} onChange={(e) => setEditValues({ ...editValues, value: e.target.value })} className="h-9" type="number" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Probability (%)</label>
              <Input value={editValues.probability} onChange={(e) => setEditValues({ ...editValues, probability: e.target.value })} className="h-9" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Owner</label>
              <Select value={editValues.owner} onValueChange={(v) => setEditValues({ ...editValues, owner: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="charlie">Charlie</SelectItem>
                  <SelectItem value="rich">Rich</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Expected Close</label>
              <Input type="date" value={editValues.expected_close_date} onChange={(e) => setEditValues({ ...editValues, expected_close_date: e.target.value })} className="h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes</label>
            <Textarea value={editValues.notes} onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateDeal.isPending}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setEditing(true)}>Edit Deal</Button>
      )}

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
          <TabsTrigger value="financials" className="flex-1">Financials</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="pt-4">
          {!activities?.length ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="font-medium capitalize">{a.action.replace("_", " ")}</p>
                    {a.metadata && typeof a.metadata === "object" && "from" in a.metadata && (
                      <p className="text-xs text-muted-foreground">
                        {stages.find(s => s.id === (a.metadata as { from: string }).from)?.label} → {stages.find(s => s.id === (a.metadata as { to: string }).to)?.label}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <p className="text-sm text-muted-foreground">Document uploads coming soon.</p>
        </TabsContent>
        <TabsContent value="financials" className="pt-4">
          {dealInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked invoices.</p>
          ) : (
            <div className="space-y-2">
              {dealInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.issue_date ? format(new Date(inv.issue_date), "dd/MM/yyyy") : "—"}</p>
                  </div>
                  <span className="text-sm font-semibold">£{(inv.total || 0).toLocaleString()}</span>
                  <Badge variant="secondary">{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DetailPanel>
  );
}
