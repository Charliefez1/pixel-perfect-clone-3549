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
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().refine((val) => {
    const n = Number(val);
    return !isNaN(n) && n > 0;
  }, { message: "Quantity must be greater than 0" }),
  unit_price: z.string().refine((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 0;
  }, { message: "Price must be 0 or greater" }),
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  organisation_id: z.string().min(1, "Client is required"),
  project_id: z.string().optional(),
  deal_id: z.string().optional(),
  vat_rate: z.string().refine((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 0;
  }, { message: "VAT rate must be 0 or greater" }),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

function generateInvoiceNumber(existingInvoices: any[]): string {
  const year = new Date().getFullYear();
  const prefix = `NDG-${year}-`;
  const existing = existingInvoices
    ?.filter((inv) => inv.invoice_number?.startsWith(prefix))
    .map((inv) => parseInt(inv.invoice_number.replace(prefix, "")) || 0) || [];
  const nextNum = Math.max(0, ...existing) + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: Props) {
  const { data: existingInvoices } = useInvoices();
  const { data: orgs } = useOrganisations();
  const { data: projects } = useProjects();
  const { data: deals } = useDeals();
  const createInvoice = useCreateInvoice();
  const createInvoiceItem = useCreateInvoiceItem();
  const logActivity = useLogActivity();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_number: "",
      organisation_id: "",
      project_id: "",
      deal_id: "",
      vat_rate: "20",
      line_items: [{ description: "", quantity: "1", unit_price: "" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  useEffect(() => {
    if (open && existingInvoices) {
      form.setValue("invoice_number", generateInvoiceNumber(existingInvoices));
    }
  }, [open, existingInvoices, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const watchLineItems = form.watch("line_items");
  const watchVatRate = form.watch("vat_rate");
  const watchOrgId = form.watch("organisation_id");

  const vat = parseFloat(watchVatRate) || 0;
  const subtotal = watchLineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await createInvoice.mutateAsync({
        invoice_number: data.invoice_number.trim(),
        organisation_id: data.organisation_id || null,
        project_id: data.project_id || null,
        deal_id: data.deal_id || null,
        subtotal,
        vat_rate: vat,
        vat_amount: vatAmount,
        total,
        due_date: dueDate.toISOString().split("T")[0],
      } as any);

      const validItems = data.line_items.filter((item) => item.description.trim() && parseFloat(item.unit_price));
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
        entity_title: data.invoice_number,
        action: "created",
      });

      toast.success("Invoice created");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-number">Invoice Number</Label>
            <Input id="inv-number" {...form.register("invoice_number")} placeholder="NDG-2026-001" autoFocus />
            {errors.invoice_number && <p className="text-sm text-destructive">{errors.invoice_number.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={watchOrgId || ""} onValueChange={(v) => form.setValue("organisation_id", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.organisation_id && <p className="text-sm text-destructive">{errors.organisation_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Deal</Label>
              <Select value={form.watch("deal_id") || ""} onValueChange={(v) => form.setValue("deal_id", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select deal..." /></SelectTrigger>
                <SelectContent>
                  {deals?.filter((d) => !watchOrgId || d.organisation_id === watchOrgId).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={form.watch("project_id") || ""} onValueChange={(v) => form.setValue("project_id", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
              <SelectContent>
                {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            {errors.line_items?.root && <p className="text-sm text-destructive">{errors.line_items.root.message}</p>}
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id}>
                  <div className="flex gap-2 items-start">
                    <Input
                      {...form.register(`line_items.${i}.description`)}
                      placeholder="Description"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      {...form.register(`line_items.${i}.quantity`)}
                      placeholder="Qty"
                      className="w-16"
                    />
                    <Input
                      type="number"
                      {...form.register(`line_items.${i}.unit_price`)}
                      placeholder="Price"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground pt-2.5 w-20 text-right">
                      {"\u00A3"}{((parseFloat(watchLineItems[i]?.quantity) || 0) * (parseFloat(watchLineItems[i]?.unit_price) || 0)).toLocaleString()}
                    </span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => remove(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {errors.line_items?.[i]?.description && (
                    <p className="text-sm text-destructive mt-1">{errors.line_items[i].description?.message}</p>
                  )}
                  {errors.line_items?.[i]?.quantity && (
                    <p className="text-sm text-destructive mt-1">{errors.line_items[i].quantity?.message}</p>
                  )}
                  {errors.line_items?.[i]?.unit_price && (
                    <p className="text-sm text-destructive mt-1">{errors.line_items[i].unit_price?.message}</p>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: "1", unit_price: "" })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-vat">VAT Rate (%)</Label>
            <Input id="inv-vat" type="number" {...form.register("vat_rate")} className="w-24" />
            {errors.vat_rate && <p className="text-sm text-destructive">{errors.vat_rate.message}</p>}
          </div>

          {subtotal > 0 && (
            <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{"\u00A3"}{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT ({vat}%)</span><span>{"\u00A3"}{vatAmount.toLocaleString()}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1"><span>Total</span><span>{"\u00A3"}{total.toLocaleString()}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createInvoice.isPending || !isValid}>
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
