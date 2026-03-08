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
import { useRateCards, useCreateRateCard, RateCard } from "@/hooks/useRateCards";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { format } from "date-fns";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

export default function RateCards() {
  const { data: rates, isLoading } = useRateCards();
  const createRate = useCreateRateCard();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<RateCard | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [halfDayRate, setHalfDayRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    createRate.mutate(
      { name, role: role || undefined, day_rate: parseFloat(dayRate) || 0, half_day_rate: parseFloat(halfDayRate) || 0, hourly_rate: parseFloat(hourlyRate) || 0, valid_from: validFrom || undefined, valid_to: validTo || undefined, notes },
      { onSuccess: () => { toast.success("Rate card created"); setDialogOpen(false); setName(""); setRole(""); setDayRate(""); setHalfDayRate(""); setHourlyRate(""); setValidFrom(""); setValidTo(""); setNotes(""); } }
    );
  };

  return (
    <>
      <PageHeader title="Rate Cards" searchPlaceholder="Search rates..." actionLabel="New Rate Card" onAction={() => setDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !rates?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No rate cards yet. Define your pricing tiers.</p></div>
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
                  {rates.map(r => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
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
          <DialogFooter><Button onClick={handleCreate} disabled={createRate.isPending}>{createRate.isPending ? "Creating..." : "Create Rate Card"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.name}
          fields={[
            { label: "Role", value: selected.role },
            { label: "Day Rate", value: `£${(selected.day_rate || 0).toLocaleString()}` },
            { label: "Half-Day", value: `£${(selected.half_day_rate || 0).toLocaleString()}` },
            { label: "Hourly", value: `£${(selected.hourly_rate || 0).toLocaleString()}` },
            { label: "Currency", value: selected.currency || "GBP" },
            { label: "Valid From", value: selected.valid_from ? format(new Date(selected.valid_from), "dd/MM/yyyy") : undefined },
            { label: "Valid To", value: selected.valid_to ? format(new Date(selected.valid_to), "dd/MM/yyyy") : undefined },
            { label: "Notes", value: selected.notes },
          ]}
        />
      )}
    </>
  );
}
