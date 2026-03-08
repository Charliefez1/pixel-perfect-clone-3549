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
import { useContracts, useCreateContract, useUpdateContract, Contract } from "@/hooks/useContracts";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useDeals } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileSignature } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  signed: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  expired: "bg-destructive/20 text-destructive",
};

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const { data: orgs } = useOrganisations();
  const { data: deals } = useDeals();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);

  const [title, setTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const [dealId, setDealId] = useState("");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createContract.mutate(
      { title, organisation_id: orgId || null, deal_id: dealId || null, value: parseFloat(value) || 0, start_date: startDate || undefined, end_date: endDate || undefined, notes },
      { onSuccess: () => { toast.success("Contract created"); setDialogOpen(false); setTitle(""); setOrgId(""); setDealId(""); setValue(""); setStartDate(""); setEndDate(""); setNotes(""); } }
    );
  };

  const totalValue = contracts?.reduce((s, c) => s + (c.value || 0), 0) || 0;
  const signedCount = contracts?.filter(c => c.status === "signed").length || 0;
  const activeCount = contracts?.filter(c => ["draft", "sent"].includes(c.status)).length || 0;

  return (
    <>
      <PageHeader title="Contracts" searchPlaceholder="Search contracts..." actionLabel="New Contract" onAction={() => setDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Value</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">£{totalValue.toLocaleString()}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Signed</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{signedCount}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">In Progress</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{activeCount}</p>}</CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !contracts?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No contracts yet. Create your first contract.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center"><FileSignature className="h-4 w-4 text-primary" /></div>
                          <span className="font-medium text-sm">{c.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-sm">£{(c.value || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusStyles[c.status] || statusStyles.draft}>{c.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.start_date ? format(new Date(c.start_date), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.end_date ? format(new Date(c.end_date), "dd/MM/yyyy") : "—"}</TableCell>
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
          <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contract title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Client</Label><Select value={orgId} onValueChange={setOrgId}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{orgs?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Deal</Label><Select value={dealId} onValueChange={setDealId}><SelectTrigger><SelectValue placeholder="Select deal" /></SelectTrigger><SelectContent>{deals?.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Value (£)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
              <div className="space-y-2"><Label>Start</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>End</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createContract.isPending}>{createContract.isPending ? "Creating..." : "Create Contract"}</Button></DialogFooter>
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
            { label: "Start Date", value: selected.start_date ? format(new Date(selected.start_date), "dd/MM/yyyy") : undefined },
            { label: "End Date", value: selected.end_date ? format(new Date(selected.end_date), "dd/MM/yyyy") : undefined },
            { label: "Signed", value: selected.signed_at ? format(new Date(selected.signed_at), "dd/MM/yyyy") : "Not yet" },
            { label: "Notes", value: selected.notes },
          ]}
        >
          <div className="flex gap-2">
            {selected.status === "draft" && (
              <Button size="sm" onClick={() => { updateContract.mutate({ id: selected.id, status: "sent" }, { onSuccess: () => { toast.success("Marked as sent"); setSelected(null); } }); }}>Mark as Sent</Button>
            )}
            {selected.status === "sent" && (
              <Button size="sm" onClick={() => { updateContract.mutate({ id: selected.id, status: "signed", signed_at: new Date().toISOString() }, { onSuccess: () => { toast.success("Marked as signed"); setSelected(null); } }); }}>Mark as Signed</Button>
            )}
          </div>
        </DetailPanel>
      )}
    </>
  );
}
