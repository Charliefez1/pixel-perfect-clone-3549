import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices, useCreateInvoice, Invoice } from "@/hooks/useInvoices";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { useLogActivity } from "@/hooks/useActivityLog";
import { useInvoiceItems } from "@/hooks/useInvoiceItems";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { useDialogs } from "@/App";
import { toast } from "sonner";
import { Eye, Send, CheckCircle2 } from "lucide-react";
import { EntityDocuments } from "@/components/documents/EntityDocuments";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  viewed: "bg-[hsl(var(--stage-qualified))]/20 text-[hsl(var(--stage-qualified))]",
  paid: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  overdue: "bg-destructive/20 text-destructive",
};

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const { openCreateInvoice } = useDialogs();
  const updateInvoice = useUpdateInvoice();
  const logActivity = useLogActivity();

  const outstanding = invoices?.filter(i => i.status !== "paid").reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const overdue = invoices?.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const paidThisMonth = invoices?.filter(i => {
    if (i.status !== "paid" || !i.paid_date) return false;
    const paidDate = new Date(i.paid_date);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  }).reduce((sum, i) => sum + (i.total || 0), 0) || 0;

  const handleMarkSent = (inv: Invoice) => {
    updateInvoice.mutate(
      { id: inv.id, status: "sent" as any, sent_at: new Date().toISOString() as any },
      {
        onSuccess: () => {
          logActivity.mutate({ entity_type: "invoice", entity_id: inv.id, entity_title: inv.invoice_number, action: "marked_sent" });
          toast.success("Invoice marked as sent");
          setSelected(null);
        },
      }
    );
  };

  const handleMarkPaid = (inv: Invoice) => {
    updateInvoice.mutate(
      { id: inv.id, status: "paid" as any, paid_date: new Date().toISOString().split("T")[0], paid_at: new Date().toISOString() as any },
      {
        onSuccess: () => {
          logActivity.mutate({ entity_type: "invoice", entity_id: inv.id, entity_title: inv.invoice_number, action: "marked_paid" });
          toast.success("Invoice marked as paid");
          setSelected(null);
        },
      }
    );
  };

  return (
    <>
      <PageHeader title="Invoices" searchPlaceholder="Search invoices..." actionLabel="New Invoice" onAction={openCreateInvoice} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Outstanding</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">£{outstanding.toLocaleString()}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Paid This Month</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">£{paidThisMonth.toLocaleString()}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Overdue</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold text-destructive">£{overdue.toLocaleString()}</p>}</CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !invoices?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No invoices yet. Create your first invoice to get started.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => setSelected(inv)}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.projects?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.issue_date ? format(new Date(inv.issue_date), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="text-right">£{(inv.subtotal || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">£{(inv.vat_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">£{(inv.total || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={statusStyles[inv.status]}>{inv.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPreviewInvoice(inv); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={`Invoice ${selected.invoice_number}`}
          badge={{ label: selected.status, className: statusStyles[selected.status] }}
          fields={[
            { label: "Client", value: selected.organisations?.name },
            { label: "Project", value: selected.projects?.name },
            { label: "Issue Date", value: selected.issue_date ? format(new Date(selected.issue_date), "dd/MM/yyyy") : undefined },
            { label: "Due Date", value: selected.due_date ? format(new Date(selected.due_date), "dd/MM/yyyy") : undefined },
            { label: "Subtotal", value: `£${(selected.subtotal || 0).toLocaleString()}` },
            { label: "VAT", value: `£${(selected.vat_amount || 0).toLocaleString()} (${selected.vat_rate || 20}%)` },
            { label: "Total", value: `£${(selected.total || 0).toLocaleString()}` },
            { label: "Notes", value: selected.notes },
          ]}
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setPreviewInvoice(selected); }}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
            {selected.status === "draft" && (
              <Button size="sm" onClick={() => handleMarkSent(selected)}>
                <Send className="h-3.5 w-3.5 mr-1" /> Mark as Sent
              </Button>
            )}
            {(selected.status === "sent" || selected.status === "viewed" || selected.status === "overdue") && (
              <Button size="sm" onClick={() => handleMarkPaid(selected)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark as Paid
              </Button>
            )}
          </div>
        </DetailPanel>
      )}

      {previewInvoice && (
        <InvoicePreview
          open={!!previewInvoice}
          onOpenChange={() => setPreviewInvoice(null)}
          invoice={previewInvoice}
        />
      )}
    </>
  );
}
