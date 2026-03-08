import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProposals, useCreateProposal, useUpdateProposal, Proposal } from "@/hooks/useProposals";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useDeals } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { format } from "date-fns";
import { toast } from "sonner";
import { Send, CheckCircle2, XCircle } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  accepted: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  declined: "bg-destructive/20 text-destructive",
};

export default function Proposals() {
  const { data: proposals, isLoading } = useProposals();
  const { data: orgs } = useOrganisations();
  const { data: deals } = useDeals();
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Proposal | null>(null);

  const [title, setTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const [dealId, setDealId] = useState("");
  const [value, setValue] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createProposal.mutate(
      { title, organisation_id: orgId || null, deal_id: dealId || null, value: parseFloat(value) || 0, valid_until: validUntil || undefined, notes },
      { onSuccess: () => { toast.success("Proposal created"); setDialogOpen(false); setTitle(""); setOrgId(""); setDealId(""); setValue(""); setValidUntil(""); setNotes(""); } }
    );
  };

  const totalValue = proposals?.reduce((s, p) => s + (p.value || 0), 0) || 0;
  const acceptedCount = proposals?.filter(p => p.status === "accepted").length || 0;
  const pendingCount = proposals?.filter(p => ["draft", "sent"].includes(p.status)).length || 0;

  return (
    <>
      <PageHeader title="Proposals" searchPlaceholder="Search proposals..." actionLabel="New Proposal" onAction={() => setDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Value</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">£{totalValue.toLocaleString()}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Accepted</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{acceptedCount}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{pendingCount}</p>}</CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !proposals?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No proposals yet. Create your first proposal.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map(p => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="pl-6 font-medium text-sm">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.deals?.title || "—"}</TableCell>
                      <TableCell className="text-sm">£{(p.value || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusStyles[p.status] || statusStyles.draft}>{p.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.valid_until ? format(new Date(p.valid_until), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell><button className="text-muted-foreground hover:text-foreground">⋯</button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Proposal title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={orgId} onValueChange={setOrgId}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{orgs?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>Deal</Label>
                <Select value={dealId} onValueChange={setDealId}><SelectTrigger><SelectValue placeholder="Select deal" /></SelectTrigger><SelectContent>{deals?.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Value (£)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
              <div className="space-y-2"><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createProposal.isPending}>{createProposal.isPending ? "Creating..." : "Create Proposal"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.title}
          badge={{ label: selected.status, className: statusStyles[selected.status] }}
          fields={[
            { label: "Client", value: selected.organisations?.name },
            { label: "Deal", value: selected.deals?.title },
            { label: "Value", value: `£${(selected.value || 0).toLocaleString()}` },
            { label: "Valid Until", value: selected.valid_until ? format(new Date(selected.valid_until), "dd/MM/yyyy") : undefined },
            { label: "Created", value: format(new Date(selected.created_at), "dd/MM/yyyy") },
            { label: "Notes", value: selected.notes },
          ]}
        >
          <div className="flex gap-2">
            {selected.status === "draft" && (
              <Button size="sm" className="gap-2" onClick={() => { updateProposal.mutate({ id: selected.id, status: "sent", sent_at: new Date().toISOString() }, { onSuccess: () => { toast.success("Marked as sent"); setSelected(null); } }); }}>
                <Send className="h-3.5 w-3.5" /> Mark as Sent
              </Button>
            )}
            {selected.status === "sent" && (
              <>
                <Button size="sm" className="gap-2" onClick={() => { updateProposal.mutate({ id: selected.id, status: "accepted", accepted_at: new Date().toISOString() }, { onSuccess: () => { toast.success("Proposal accepted"); setSelected(null); } }); }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                </Button>
                <Button size="sm" variant="destructive" className="gap-2" onClick={() => { updateProposal.mutate({ id: selected.id, status: "declined", declined_at: new Date().toISOString() }, { onSuccess: () => { toast.success("Proposal declined"); setSelected(null); } }); }}>
                  <XCircle className="h-3.5 w-3.5" /> Declined
                </Button>
              </>
            )}
          </div>
        </DetailPanel>
      )}
    </>
  );
}
