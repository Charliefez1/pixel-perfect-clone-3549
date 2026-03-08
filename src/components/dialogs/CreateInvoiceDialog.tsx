import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInvoice, useInvoices } from "@/hooks/useInvoices";
import { useCreateInvoiceItem } from "@/hooks/useInvoiceItems";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useProjects } from "@/hooks/useProjects";
import { useDeals } from "@/hooks/useDeals";
import { useLogActivity } from "@/hooks/useActivityLog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface LineItem {
  description: string;
  quantity: string;
  unit_price: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateInvoiceNumber(existingInvoices: any[]): string {
  const year = new Date().getFullYear();
  const prefix = `NDG-${year}-`;
  const existing = existingInvoices
    ?.filter((inv) => inv.invoice_number?.startsWith(prefix))
    .map((inv) => parseInt(inv.invoice_number.replace(prefix, "")) || 0) || [];
  const nextNum = Math.max(0, ...existing) + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export function CreateInvoiceDialog({ open, onOpenChange }: Props) {
  const { data: existingInvoices } = useInvoices();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [orgId, setOrgId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dealId, setDealId] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: "1", unit_price: "" }]);
  const { data: orgs } = useOrganisations();
  const { data: projects } = useProjects();
  const { data: deals } = useDeals();
  const createInvoice = useCreateInvoice();
  const createInvoiceItem = useCreateInvoiceItem();
  const logActivity = useLogActivity();

  useEffect(() => {
    if (open && existingInvoices) {
      setInvoiceNumber(generateInvoiceNumber(existingInvoices));
    }
  }, [open, existingInvoices]);

  const addLineItem = () => setLineItems([...lineItems, { description: "", quantity: "1", unit_price: "" }]);
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    updated[i][field] = value;
    setLineItems(updated);
  };

  const vat = parseFloat(vatRate) || 0;
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await createInvoice.mutateAsync({
        invoice_number: invoiceNumber.trim(),
        organisation_id: orgId || null,
        project_id: projectId || null,
        deal_id: dealId || null,
        subtotal,
        vat_rate: vat,
        vat_amount: vatAmount,
        total,
        due_date: dueDate.toISOString().split("T")[0],
      } as any);

      // Create line items
      const validItems = lineItems.filter((item) => item.description.trim() && parseFloat(item.unit_price));
      for (const item of validItems) {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unit_price) || 0;
        await createInvoiceItem.mutateAsync({
          invoice_id: invoice.id,
          description: item.description.trim(),
          quantity: qty,
          unit_price: price,
          total: qty * price,
        });
      }

      logActivity.mutate({
        entity_type: "invoice",
        entity_id: invoice.id,
        entity_title: invoiceNumber,
        action: "created",
      });

      toast.success("Invoice created");
      setInvoiceNumber("");
      setOrgId("");
      setProjectId("");
      setDealId("");
      setVatRate("20");
      setLineItems([{ description: "", quantity: "1", unit_price: "" }]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-number">Invoice Number</Label>
            <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="NDG-2026-001" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                <SelectContent>
                  {orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deal</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger><SelectValue placeholder="Select deal…" /></SelectTrigger>
                <SelectContent>
                  {deals?.filter((d) => !orgId || d.organisation_id === orgId).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
              <SelectContent>
                {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(i, "description", e.target.value)}
                    placeholder="Description"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
                    placeholder="Qty"
                    className="w-16"
                  />
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(i, "unit_price", e.target.value)}
                    placeholder="Price"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground pt-2.5 w-20 text-right">
                    £{((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString()}
                  </span>
                  {lineItems.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => removeLineItem(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-vat">VAT Rate (%)</Label>
            <Input id="inv-vat" type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-24" />
          </div>

          {subtotal > 0 && (
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{subtotal.toLocaleString()}</span></div>
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
