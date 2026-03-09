import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal, Deal } from "@/hooks/useDeals";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useContacts } from "@/hooks/useContacts";
import { useLogActivity } from "@/hooks/useActivityLog";
import { Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Constants } from "@/integrations/supabase/types";

const stages = Constants.public.Enums.deal_stage;

const stageConfig: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-slate-400" },
  qualified: { label: "Qualified", color: "bg-blue-400" },
  proposal: { label: "Proposal", color: "bg-cyan-400" },
  negotiation: { label: "Negotiation", color: "bg-amber-400" },
  verbal: { label: "Verbal", color: "bg-purple-400" },
  won: { label: "Won", color: "bg-green-500" },
  lost: { label: "Lost", color: "bg-red-400" },
};

export default function Deals() {
  const { data: deals, isLoading } = useDeals();
  const { data: orgs } = useOrganisations();
  const { data: contacts } = useContacts();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const logActivity = useLogActivity();
  const [view, setView] = useState<ViewMode>("board");
  const [selected, setSelected] = useState<Deal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const pipelineStages = stages.filter(s => s !== "won" && s !== "lost");
  const pipelineValue = deals?.filter(d => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + (Number(d.value) || 0), 0) || 0;
  const wonValue = deals?.filter(d => d.stage === "won").reduce((s, d) => s + (Number(d.value) || 0), 0) || 0;

  const handleCreate = () => {
    if (!formTitle.trim()) { toast.error("Title is required"); return; }
    createDeal.mutate(
      {
        title: formTitle,
        organisation_id: formOrg || null,
        contact_id: formContact || null,
        value: parseFloat(formValue) || 0,
        notes: formNotes || null,
      },
      {
        onSuccess: () => {
          toast.success("Deal created");
          setDialogOpen(false);
          setFormTitle(""); setFormOrg(""); setFormContact(""); setFormValue(""); setFormNotes("");
        },
      }
    );
  };

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const deal = deals?.find(d => d.id === id);
    if (!deal || deal.stage === stageId) { setDraggedId(null); return; }

    updateDeal.mutate(
      { id, stage: stageId as any },
      {
        onSuccess: () => {
          logActivity.mutate({
            entity_type: "deal",
            entity_id: id,
            entity_title: deal.title,
            action: "stage_changed",
            metadata: { from: deal.stage, to: stageId },
          });
          toast.success(`Moved "${deal.title}" to ${stageConfig[stageId]?.label}`);
        },
      }
    );
    setDraggedId(null);
  }, [deals, updateDeal, logActivity]);

  const formatCurrency = (v: number | null) => v != null ? `£${Number(v).toLocaleString()}` : "—";

  return (
    <>
      <PageHeader title="Deals" searchPlaceholder="Search deals..." actionLabel="New Deal" onAction={() => setDialogOpen(true)}>
        <ViewToggle value={view} onChange={setView} />
      </PageHeader>

      <div className="border-b bg-card/50 px-6 py-3 flex items-center gap-6 text-sm">
        <span>Pipeline: <strong>{formatCurrency(pipelineValue)}</strong></span>
        <span>Won: <strong>{formatCurrency(wonValue)}</strong></span>
        <span><strong>{deals?.filter(d => d.stage !== "won" && d.stage !== "lost").length || 0}</strong> active deals</span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">{[...Array(5)].map((_, i) => <div key={i} className="w-64 space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-32 w-full" /></div>)}</div>
        ) : view === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)]">
            {pipelineStages.map(stageId => {
              const stageDeals = deals?.filter(d => d.stage === stageId) || [];
              const cfg = stageConfig[stageId];
              return (
                <div key={stageId} className={cn("flex-shrink-0 w-72 flex flex-col rounded-lg transition-colors", draggedId ? "bg-accent/30" : "")}
                  onDragOver={handleDragOver} onDrop={e => handleDrop(e, stageId)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cfg?.color}`} />
                      <span className="text-sm font-semibold">{cfg?.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{stageDeals.length}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {stageDeals.map(deal => (
                      <Card key={deal.id} className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                        onClick={() => setSelected(deal)} draggable onDragStart={e => handleDragStart(e, deal.id)}>
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-sm font-medium truncate">{deal.title}</p>
                          <p className="text-xs text-muted-foreground">{deal.organisations?.name || "No organisation"}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-primary">{formatCurrency(Number(deal.value))}</span>
                            {deal.expected_close_date && <span className="text-[10px] text-muted-foreground">{format(parseISO(deal.expected_close_date), "dd MMM")}</span>}
                          </div>
                          {deal.probability != null && deal.probability > 0 && (
                            <Badge variant="secondary" className="text-[10px]">{deal.probability}%</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add deal
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {deals?.map(deal => (
              <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(deal)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.organisations?.name || "No organisation"}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(Number(deal.value))}</span>
                  <Badge variant="secondary">{stageConfig[deal.stage]?.label || deal.stage}</Badge>
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Probability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals?.map(deal => (
                  <TableRow key={deal.id} className="cursor-pointer" onClick={() => setSelected(deal)}>
                    <TableCell className="pl-6 font-medium">{deal.title}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.organisations?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : "—"}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(deal.value))}</TableCell>
                    <TableCell><Badge variant="secondary">{stageConfig[deal.stage]?.label || deal.stage}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{deal.expected_close_date ? format(parseISO(deal.expected_close_date), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell>{deal.probability != null ? `${deal.probability}%` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create Deal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Deal name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Select value={formOrg} onValueChange={setFormOrg}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{orgs?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select value={formContact} onValueChange={setFormContact}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{contacts?.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Value (£)</Label><Input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="0" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createDeal.isPending}>{createDeal.isPending ? "Creating..." : "Create Deal"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.title}
          badge={{ label: stageConfig[selected.stage]?.label || selected.stage, className: stageConfig[selected.stage]?.color }}
          fields={[
            { label: "Organisation", value: selected.organisations?.name },
            { label: "Contact", value: selected.contacts ? `${selected.contacts.first_name} ${selected.contacts.last_name}` : undefined },
            { label: "Value", value: formatCurrency(Number(selected.value)) },
            { label: "Probability", value: selected.probability != null ? `${selected.probability}%` : undefined },
            { label: "Expected Close", value: selected.expected_close_date ? format(parseISO(selected.expected_close_date), "dd/MM/yyyy") : undefined },
            { label: "Service Type", value: selected.service_type },
            { label: "Package Size", value: selected.package_size },
            { label: "Notes", value: selected.notes },
          ]}
        />
      )}
    </>
  );
}
