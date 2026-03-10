import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, Contract } from "@/hooks/useContracts";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useLogActivity } from "@/hooks/useActivityLog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { EmptyState } from "@/components/layout/EmptyState";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileSignature, Loader2 } from "lucide-react";
import { EntityDocuments } from "@/components/documents/EntityDocuments";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  signed: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  expired: "bg-destructive/20 text-destructive",
};

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const { data: orgs } = useOrganisations();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const logActivity = useLogActivity();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; action: () => void } | null>(null);

  const [title, setTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editValue, setEditValue] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createContract.mutate(
      { title, organisation_id: orgId || null, value: parseFloat(value) || 0, start_date: startDate || undefined, end_date: endDate || undefined, notes },
      { onSuccess: () => { toast.success("Contract created"); setDialogOpen(false); setTitle(""); setOrgId(""); setValue(""); setStartDate(""); setEndDate(""); setNotes(""); } }
    );
  };

  const startEditing = (c: Contract) => {
    setEditTitle(c.title);
    setEditNotes(c.notes || "");
    setEditValue((c.value || 0).toString());
    setEditing(true);
  };

  const handleSave = () => {
    if (!selected) return;
    updateContract.mutate(
      { id: selected.id, title: editTitle, notes: editNotes, value: parseFloat(editValue) || 0 },
      {
        onSuccess: (data) => {
          toast.success("Contract updated");
          setEditing(false);
          setSelected({ ...selected, ...data, organisations: selected.organisations } as Contract);
        },
      }
    );
  };

  const handleStatusChange = (contract: Contract, newStatus: string, extraFields?: Record<string, any>) => {
    setConfirmAction({
      label: `Mark as ${newStatus}`,
      action: () => {
        updateContract.mutate(
          { id: contract.id, status: newStatus, ...extraFields },
          {
            onSuccess: (data) => {
              logActivity.mutate({ entity_type: "contract", entity_id: contract.id, entity_title: contract.title, action: "status_changed", metadata: { from: contract.status, to: newStatus } });
              toast.success(`Contract marked as ${newStatus}`);
              setSelected({ ...contract, ...data, organisations: contract.organisations } as Contract);
              setConfirmAction(null);
            },
          }
        );
      },
    });
  };

  const filtered = contracts?.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.organisations?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = filtered?.reduce((s, c) => s + (c.value || 0), 0) || 0;
  const signedCount = filtered?.filter(c => c.status === "signed").length || 0;
  const activeCount = filtered?.filter(c => ["draft", "sent"].includes(c.status)).length || 0;

  return (
    <>
      <PageHeader title="Contracts" searchPlaceholder="Search contracts..." actionLabel="New Contract" onAction={() => setDialogOpen(true)} onSearch={setSearch} />
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
            ) : !filtered?.length ? (
              <EmptyState icon={FileSignature} title="No contracts found" description={search ? "No contracts match your search." : "Create your first contract."} action={!search ? { label: "New Contract", onClick: () => setDialogOpen(true) } : undefined} />
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
                  {filtered.map(c => (
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

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contract title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Client</Label><Select value={orgId} onValueChange={setOrgId}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{orgs?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Value (£)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>End</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createContract.isPending}>{createContract.isPending ? "Creating..." : "Create Contract"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail panel with edit/delete */}
      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => { setSelected(null); setEditing(false); }}
          title={selected.title}
          badge={{ label: selected.status, className: statusStyles[selected.status] }}
          fields={editing ? [] : [
            { label: "Client", value: selected.organisations?.name },
            { label: "Value", value: `£${(selected.value || 0).toLocaleString()}` },
            { label: "Start Date", value: selected.start_date ? format(new Date(selected.start_date), "dd/MM/yyyy") : undefined },
            { label: "End Date", value: selected.end_date ? format(new Date(selected.end_date), "dd/MM/yyyy") : undefined },
            { label: "Signed", value: selected.signed_at ? format(new Date(selected.signed_at), "dd/MM/yyyy") : "Not yet" },
            { label: "Notes", value: selected.notes },
          ]}
        >
          {editing ? (
            <div className="space-y-3 mb-4">
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Title</label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Value (£)</label><Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="h-9" /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Notes</label><Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={updateContract.isPending}>{updateContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => startEditing(selected)}>Edit</Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
              {selected.status === "draft" && (
                <Button size="sm" onClick={() => handleStatusChange(selected, "sent")} disabled={updateContract.isPending}>
                  {updateContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Sent"}
                </Button>
              )}
              {selected.status === "sent" && (
                <Button size="sm" onClick={() => handleStatusChange(selected, "signed", { signed_at: new Date().toISOString() })} disabled={updateContract.isPending}>
                  {updateContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Signed"}
                </Button>
              )}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">File Attachments</p>
            <EntityDocuments entityType="contract" entityId={selected.id} />
          </div>
        </DetailPanel>
      )}

      {/* Status change confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to {confirmAction?.label?.toLowerCase()}? This action will be logged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction?.action}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={selected?.title || ""}
        onConfirm={() => {
          if (!selected) return;
          deleteContract.mutate(selected.id, {
            onSuccess: () => { toast.success("Contract deleted"); setSelected(null); setDeleteOpen(false); },
            onError: (e) => toast.error(e.message),
          });
        }}
        loading={deleteContract.isPending}
      />
    </>
  );
}
