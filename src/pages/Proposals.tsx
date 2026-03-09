import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useProposals, useCreateProposal, useUpdateProposal, Proposal } from "@/hooks/useProposals";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useDeals } from "@/hooks/useDeals";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
};

export default function Proposals() {
  const { data: proposals, isLoading } = useProposals();
  const { data: orgs } = useOrganisations();
  const { data: deals } = useDeals();
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();
  const [selected, setSelected] = useState<Proposal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formDeal, setFormDeal] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const handleCreate = () => {
    if (!formTitle.trim()) { toast.error("Title is required"); return; }
    createProposal.mutate(
      {
        title: formTitle,
        organisation_id: formOrg || null,
        deal_id: formDeal || null,
        value: parseFloat(formValue) || 0,
        valid_until: formValidUntil || undefined,
        notes: formNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Proposal created");
          setDialogOpen(false);
          setFormTitle(""); setFormOrg(""); setFormDeal(""); setFormValue(""); setFormValidUntil(""); setFormNotes("");
        },
      }
    );
  };

  const handleStatusChange = (proposal: Proposal, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === "sent") updates.sent_at = new Date().toISOString();
    if (newStatus === "accepted") updates.accepted_at = new Date().toISOString();
    if (newStatus === "declined") updates.declined_at = new Date().toISOString();

    updateProposal.mutate({ id: proposal.id, ...updates }, {
      onSuccess: () => toast.success(`Proposal marked as ${newStatus}`),
    });
  };

  const totalValue = proposals?.reduce((s, p) => s + (Number(p.value) || 0), 0) || 0;
  const pendingCount = proposals?.filter(p => p.status === "sent" || p.status === "draft").length || 0;

  return (
    <>
      <PageHeader title="Proposals" searchPlaceholder="Search proposals..." actionLabel="New Proposal" onAction={() => setDialogOpen(true)} />

      <div className="border-b bg-card/50 px-6 py-3 flex items-center gap-6 text-sm">
        <span>Total value: <strong>£{totalValue.toLocaleString()}</strong></span>
        <span><strong>{pendingCount}</strong> pending</span>
        <span><strong>{proposals?.filter(p => p.status === "accepted").length || 0}</strong> accepted</span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !proposals?.length ? (
          <div className="p-12 text-center text-muted-foreground"><p>No proposals yet. Create your first one.</p></div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Proposal</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map(p => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                    <TableCell className="pl-6 font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{p.organisations?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.deals?.title || "—"}</TableCell>
                    <TableCell className="font-semibold">£{Number(p.value || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[p.status]?.variant || "secondary"}>
                        {statusConfig[p.status]?.label || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.valid_until ? format(parseISO(p.valid_until), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sent_at ? format(new Date(p.sent_at), "dd/MM/yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Proposal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Proposal name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Select value={formOrg} onValueChange={setFormOrg}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{orgs?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deal</Label>
                <Select value={formDeal} onValueChange={setFormDeal}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{deals?.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Value (£)</Label><Input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="0" /></div>
              <div className="space-y-2"><Label>Valid Until</Label><Input type="date" value={formValidUntil} onChange={e => setFormValidUntil(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createProposal.isPending}>{createProposal.isPending ? "Creating..." : "Create Proposal"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.title}
          badge={{ label: statusConfig[selected.status]?.label || selected.status, className: selected.status === "accepted" ? "bg-green-500" : selected.status === "declined" ? "bg-red-400" : undefined }}
          fields={[
            { label: "Organisation", value: selected.organisations?.name },
            { label: "Deal", value: selected.deals?.title },
            { label: "Value", value: `£${Number(selected.value || 0).toLocaleString()}` },
            { label: "Status", value: statusConfig[selected.status]?.label || selected.status },
            { label: "Valid Until", value: selected.valid_until ? format(parseISO(selected.valid_until), "dd/MM/yyyy") : undefined },
            { label: "Sent", value: selected.sent_at ? format(new Date(selected.sent_at), "PPP") : undefined },
            { label: "Accepted", value: selected.accepted_at ? format(new Date(selected.accepted_at), "PPP") : undefined },
            { label: "Notes", value: selected.notes },
          ]}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.status === "draft" && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected, "sent")}>Mark as Sent</Button>
            )}
            {(selected.status === "draft" || selected.status === "sent") && (
              <>
                <Button size="sm" onClick={() => handleStatusChange(selected, "accepted")}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(selected, "declined")}>Decline</Button>
              </>
            )}
          </div>
        </DetailPanel>
      )}
    </>
  );
}
