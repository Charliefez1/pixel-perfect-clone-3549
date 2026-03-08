import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: Props) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [orgId, setOrgId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const { data: orgs } = useOrganisations();
  const { data: projects } = useProjects();
  const createInvoice = useCreateInvoice();

  const sub = parseFloat(subtotal) || 0;
  const vat = parseFloat(vatRate) || 0;
  const vatAmount = sub * (vat / 100);
  const total = sub + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;
    try {
      await createInvoice.mutateAsync({
        invoice_number: invoiceNumber.trim(),
        organisation_id: orgId || null,
        project_id: projectId || null,
        subtotal: sub,
        vat_rate: vat,
        vat_amount: vatAmount,
        total,
      });
      toast.success("Invoice created");
      setInvoiceNumber(""); setOrgId(""); setProjectId(""); setSubtotal(""); setVatRate("20");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-number">Invoice Number</Label>
            <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g. INV-2026-001" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inv-subtotal">Subtotal (£)</Label>
              <Input id="inv-subtotal" type="number" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-vat">VAT Rate (%)</Label>
              <Input id="inv-vat" type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
            </div>
          </div>
          {sub > 0 && (
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{sub.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT ({vat}%)</span><span>£{vatAmount.toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1"><span>Total</span><span>£{total.toLocaleString()}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createInvoice.isPending || !invoiceNumber.trim()}>
              {createInvoice.isPending ? "Creating…" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
