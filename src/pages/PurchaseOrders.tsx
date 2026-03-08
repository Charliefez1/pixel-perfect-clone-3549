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
import { usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrder, PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { format } from "date-fns";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  approved: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  rejected: "bg-destructive/20 text-destructive",
};

const poCategories = ["Venue Hire", "Catering", "Materials", "Travel", "Equipment", "Software", "Contractor", "Other"];

export default function PurchaseOrders() {
  const { data: pos, isLoading } = usePurchaseOrders();
  const { data: orgs } = useOrganisations();
  const { data: projects } = useProjects();
  const createPO = useCreatePurchaseOrder();
  const updatePO = useUpdatePurchaseOrder();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);

  const [poNumber, setPoNumber] = useState("");
  const [orgId, setOrgId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    if (!poNumber.trim()) { toast.error("PO number is required"); return; }
    createPO.mutate(
      { po_number: poNumber, organisation_id: orgId || null, project_id: projectId || null, description, category: category || undefined, amount: parseFloat(amount) || 0, notes },
      { onSuccess: () => { toast.success("PO created"); setDialogOpen(false); setPoNumber(""); setOrgId(""); setProjectId(""); setDescription(""); setCategory(""); setAmount(""); setNotes(""); } }
    );
  };

  const totalSpend = pos?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const approvedSpend = pos?.filter(p => p.status === "approved").reduce((s, p) => s + (p.amount || 0), 0) || 0;
  const pendingCount = pos?.filter(p => ["draft", "submitted"].includes(p.status)).length || 0;

  return (
    <>
      <PageHeader title="Purchase Orders" searchPlaceholder="Search POs..." actionLabel="New PO" onAction={() => setDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Spend</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">£{totalSpend.toLocaleString()}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Approved</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">£{approvedSpend.toLocaleString()}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{pendingCount}</p>}</CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !pos?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No purchase orders yet. Track your first expense.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">PO Number</TableHead>
                    <TableHead>Supplier / Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map(p => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center"><ShoppingCart className="h-4 w-4 text-primary" /></div>
                          <span className="font-medium text-sm">{p.po_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.projects?.name || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{p.category || "—"}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">£{(p.amount || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusStyles[p.status] || statusStyles.draft}>{p.status}</Badge></TableCell>
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
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>PO Number</Label><Input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="PO-001" /></div>
              <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{poCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Supplier / Client</Label><Select value={orgId} onValueChange={setOrgId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{orgs?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Project</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Amount (£)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createPO.isPending}>{createPO.isPending ? "Creating..." : "Create PO"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.po_number}
          badge={{ label: selected.status, className: statusStyles[selected.status] }}
          fields={[
            { label: "Supplier", value: selected.organisations?.name },
            { label: "Project", value: selected.projects?.name },
            { label: "Category", value: selected.category },
            { label: "Amount", value: `£${(selected.amount || 0).toLocaleString()}` },
            { label: "Description", value: selected.description },
            { label: "Issue Date", value: selected.issue_date ? format(new Date(selected.issue_date), "dd/MM/yyyy") : undefined },
            { label: "Notes", value: selected.notes },
          ]}
        >
          <div className="flex gap-2">
            {selected.status === "draft" && (
              <Button size="sm" onClick={() => { updatePO.mutate({ id: selected.id, status: "submitted" }, { onSuccess: () => { toast.success("Submitted for approval"); setSelected(null); } }); }}>Submit</Button>
            )}
            {selected.status === "submitted" && (
              <>
                <Button size="sm" onClick={() => { updatePO.mutate({ id: selected.id, status: "approved", approved_at: new Date().toISOString() }, { onSuccess: () => { toast.success("Approved"); setSelected(null); } }); }}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => { updatePO.mutate({ id: selected.id, status: "rejected" }, { onSuccess: () => { toast.success("Rejected"); setSelected(null); } }); }}>Reject</Button>
              </>
            )}
          </div>
        </DetailPanel>
      )}
    </>
  );
}
