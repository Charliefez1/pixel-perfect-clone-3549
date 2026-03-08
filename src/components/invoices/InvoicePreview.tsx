import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useInvoiceItems } from "@/hooks/useInvoiceItems";
import { format } from "date-fns";
import { useRef } from "react";

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    issue_date: string | null;
    due_date: string | null;
    subtotal: number | null;
    vat_rate: number | null;
    vat_amount: number | null;
    total: number | null;
    notes: string | null;
    organisations?: { name: string } | null;
    projects?: { name: string } | null;
  };
}

export function InvoicePreview({ open, onOpenChange, invoice }: InvoicePreviewProps) {
  const { data: items } = useInvoiceItems(invoice.id);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .brand { font-size: 24px; font-weight: 700; color: #0066cc; }
        .brand-sub { font-size: 12px; color: #666; margin-top: 4px; }
        .meta { text-align: right; }
        .meta h2 { font-size: 28px; color: #333; margin: 0; }
        .meta p { font-size: 12px; color: #666; margin: 2px 0; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .party h4 { font-size: 11px; text-transform: uppercase; color: #999; margin: 0 0 4px; }
        .party p { margin: 2px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        td.right, th.right { text-align: right; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 250px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .totals-row.total { font-weight: 700; font-size: 16px; border-top: 2px solid #333; padding-top: 10px; margin-top: 4px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-6 p-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xl font-bold text-primary">NDG</div>
              <p className="text-xs text-muted-foreground">Neuroscience Development Group</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
            </div>
          </div>

          <Separator />

          {/* Parties */}
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Bill To</p>
              <p className="font-medium">{invoice.organisations?.name || "—"}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-muted-foreground">Issue: {invoice.issue_date ? format(new Date(invoice.issue_date), "dd/MM/yyyy") : "—"}</p>
              <p className="text-xs text-muted-foreground">Due: {invoice.due_date ? format(new Date(invoice.due_date), "dd/MM/yyyy") : "—"}</p>
              {invoice.projects?.name && <p className="text-xs text-muted-foreground">Project: {invoice.projects.name}</p>}
            </div>
          </div>

          {/* Line Items */}
          {items && items.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 text-xs text-muted-foreground uppercase">Description</th>
                  <th className="py-2 text-xs text-muted-foreground uppercase text-right">Qty</th>
                  <th className="py-2 text-xs text-muted-foreground uppercase text-right">Unit Price</th>
                  <th className="py-2 text-xs text-muted-foreground uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">£{(item.unit_price || 0).toLocaleString()}</td>
                    <td className="py-2 text-right">£{(item.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="border rounded-md p-4 text-sm text-muted-foreground text-center">
              No line items — using header totals
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-60 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>£{(invoice.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.vat_rate || 20}%)</span>
                <span>£{(invoice.vat_amount || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold pt-1">
                <span>Total</span>
                <span>£{(invoice.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Payment Terms: Net 30 days</p>
            <p>Bank: Neuroscience Development Group Ltd</p>
            {invoice.notes && <p>Notes: {invoice.notes}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleDownloadPDF}>Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
