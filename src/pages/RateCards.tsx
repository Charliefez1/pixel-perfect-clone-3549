import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRateCards, useCreateRateCard, useUpdateRateCard, useDeleteRateCard, RateCard } from "@/hooks/useRateCards";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { EmptyState } from "@/components/layout/EmptyState";
import { format } from "date-fns";
import { toast } from "sonner";
import { CreditCard, Pencil, Trash2, Loader2 } from "lucide-react";

export default function RateCards() {
  const { data: rates, isLoading, error, refetch } = useRateCards();
  const createRate = useCreateRateCard();
  const updateRate = useUpdateRateCard();
  const deleteRate = useDeleteRateCard();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<RateCard | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [halfDayRate, setHalfDayRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [notes, setNotes] = useState("");

  // Edit fields
  const [eName, setEName] = useState("");
  const [eRole, setERole] = useState("");
  const [eDayRate, setEDayRate] = useState("");
  const [eHalfDayRate, setEHalfDayRate] = useState("");
  const [eHourlyRate, setEHourlyRate] = useState("");
  const [eValidFrom, setEValidFrom] = useState("");
  const [eValidTo, setEValidTo] = useState("");
  const [eNotes, setENotes] = useState("");

  const startEdit = () => {
    if (!selected) return;
    setEName(selected.name);
    setERole(selected.role || "");
    setEDayRate(String(selected.day_rate || 0));
    setEHalfDayRate(String(selected.half_day_rate || 0));
    setEHourlyRate(String(selected.hourly_rate || 0));
    setEValidFrom(selected.valid_from || "");
    setEValidTo(selected.valid_to || "");
    setENotes(selected.notes || "");
    setEditing(true);
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    createRate.mutate(
      { name, role: role || undefined, day_rate: parseFloat(dayRate) || 0, half_day_rate: parseFloat(halfDayRate) || 0, hourly_rate: parseFloat(hourlyRate) || 0, valid_from: validFrom || undefined, valid_to: validTo || undefined, notes },
      { onSuccess: () => { toast.success("Rate card created"); setDialogOpen(false); setName(""); setRole(""); setDayRate(""); setHalfDayRate(""); setHourlyRate(""); setValidFrom(""); setValidTo(""); setNotes(""); } }
    );
  };

  const handleSaveEdit = () => {
    if (!selected || !eName.trim()) return;
    updateRate.mutate(
      { id: selected.id, name: eName, role: eRole || null, day_rate: parseFloat(eDayRate) || 0, half_day_rate: parseFloat(eHalfDayRate) || 0, hourly_rate: parseFloat(eHourlyRate) || 0, valid_from: eValidFrom || null, valid_to: eValidTo || null, notes: eNotes || null },
      { onSuccess: (data) => { toast.success("Rate card updated"); setEditing(false); setSelected(data as RateCard); } }
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteRate.mutate(selected.id, { onSuccess: () => { toast.success("Rate card deleted"); setDeleteOpen(false); setSelected(null); } });
  };

  const filtered = rates?.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Rate Cards" searchPlaceholder="Search rates..." actionLabel="New Rate Card" onAction={() => setDialogOpen(true)} onSearch={setSearch} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-destructive">{error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !filtered?.length ? (
              <EmptyState icon={CreditCard} title="No rate cards found" description="Define your pricing tiers." action={{ label: "New Rate Card", onClick: () => setDialogOpen(true) }} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Day Rate</TableHead>
                    <TableHead>Half-Day</TableHead>
                    <TableHead>Hourly</TableHead>
                    <TableHead>Valid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => { setSelected(r); setEditing(false); }}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center"><CreditCard className="h-4 w-4 text-primary" /></div>
                          <span className="font-medium text-sm">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.role || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">£{(r.day_rate || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">£{(r.half_day_rate || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">£{(r.hourly_rate || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.valid_from ? format(new Date(r.valid_from), "dd/MM/yyyy") : "—"} {r.valid_to ? `– ${format(new Date(r.valid_to), "dd/MM/yyyy")}` : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Rate Card</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Senior Facilitator" /></div>
              <div className="space-y-2"><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Lead Consultant" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Day Rate (£)</Label><Input type="number" value={dayRate} onChange={e => setDayRate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Half-Day (£)</Label><Input type="number" value={halfDayRate} onChange={e => setHalfDayRate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Hourly (£)</Label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valid From</Label><Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} /></div>
              <div className="space-y-2"><Label>Valid To</Label><Input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createRate.isPending}>{createRate.isPending ? "Creating…" : "Create Rate Card"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => { setSelected(null); setEditing(false); }}
          title={editing ? eName : selected.name}
          fields={editing ? [] : [
            { label: "Role", value: selected.role },
            { label: "Day Rate", value: `£${(selected.day_rate || 0).toLocaleString()}` },
            { label: "Half-Day", value: `£${(selected.half_day_rate || 0).toLocaleString()}` },
            { label: "Hourly", value: `£${(selected.hourly_rate || 0).toLocaleString()}` },
            { label: "Currency", value: selected.currency || "GBP" },
            { label: "Valid From", value: selected.valid_from ? format(new Date(selected.valid_from), "dd/MM/yyyy") : undefined },
            { label: "Valid To", value: selected.valid_to ? format(new Date(selected.valid_to), "dd/MM/yyyy") : undefined },
            { label: "Notes", value: selected.notes },
          ]}
        >
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={eName} onChange={e => setEName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Role</Label><Input value={eRole} onChange={e => setERole(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Day Rate (£)</Label><Input type="number" value={eDayRate} onChange={e => setEDayRate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Half-Day (£)</Label><Input type="number" value={eHalfDayRate} onChange={e => setEHalfDayRate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Hourly (£)</Label><Input type="number" value={eHourlyRate} onChange={e => setEHourlyRate(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valid From</Label><Input type="date" value={eValidFrom} onChange={e => setEValidFrom(e.target.value)} /></div>
                <div className="space-y-2"><Label>Valid To</Label><Input type="date" value={eValidTo} onChange={e => setEValidTo(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={eNotes} onChange={e => setENotes(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateRate.isPending}>{updateRate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={startEdit}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
            </div>
          )}
        </DetailPanel>
      )}

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="rate card" onConfirm={handleDelete} loading={deleteRate.isPending} />
    </>
  );
}
