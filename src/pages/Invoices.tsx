import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { useLogActivity } from "@/hooks/useActivityLog";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { format } from "date-fns";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { useDialogs } from "@/App";
import { toast } from "sonner";
import { Eye, Send, CheckCircle2, Receipt, Loader2 } from "lucide-react";
import { EntityDocuments } from "@/components/documents/EntityDocuments";

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ label: string; action: () => void } | null>(null);
  const { openCreateInvoice } = useDialogs();
  const updateInvoice = useUpdateInvoice();
  const logActivity = useLogActivity();

  const filtered = invoices?.filter(i =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    i.organisations?.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.projects?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const outstanding = filtered?.filter(i => i.status !== "paid").reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const overdue = filtered?.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const paidThisMonth = filtered?.filter(i => {
    if (i.status !== "paid" || !i.paid_date) return false;
    const paidDate = new Date(i.paid_date);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  }).reduce((sum, i) => sum + (i.total || 0), 0) || 0;

  const handleStatusChange = (inv: Invoice, newStatus: string, extraFields?: Record<string, any>) => {
    setConfirmAction({
      label: `Mark as ${newStatus}`,
      action: () => {
        updateInvoice.mutate(
          { id: inv.id, status: newStatus as any, ...extraFields },
          {
            onSuccess: (data) => {
              logActivity.mutate({ entity_type: "invoice", entity_id: inv.id, entity_title: inv.invoice_number, action: `marked_${newStatus}` });
              toast.success(`Invoice marked as ${newStatus}`);
              setSelected({ ...inv, ...data, organisations: inv.organisations, projects: inv.projects } as Invoice);
              setConfirmAction(null);
            },
          }
        );
      },
    });
  };

  return (
    <>
      <PageHeader title="Invoices" searchPlaceholder="Search invoices..." actionLabel="New Invoice" onAction={openCreateInvoice} onSearch={setSearch} />
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
            ) : !filtered?.length ? (
              <EmptyState icon={Receipt} title="No invoices found" description={search ? "No invoices match your search." : "Create your first invoice to get started."} action={!search ? { label: "New Invoice", onClick: openCreateInvoice } : undefined} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => setSelected(inv)}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.projects?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.issue_date ? format(new Date(inv.issue_date), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="text-right font-semibold">£{(inv.total || 0).toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
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
          badge={{ label: selected.status }}
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
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => setPreviewInvoice(selected)}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
            {selected.status === "draft" && (
              <Button size="sm" onClick={() => handleStatusChange(selected, "sent", { sent_at: new Date().toISOString() })} disabled={updateInvoice.isPending}>
                {updateInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1" /> Mark as Sent</>}
              </Button>
            )}
            {(selected.status === "sent" || selected.status === "viewed" || selected.status === "overdue") && (
              <Button size="sm" onClick={() => handleStatusChange(selected, "paid", { paid_date: new Date().toISOString().split("T")[0], paid_at: new Date().toISOString() })} disabled={updateInvoice.isPending}>
                {updateInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark as Paid</>}
              </Button>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">File Attachments</p>
            <EntityDocuments entityType="invoice" entityId={selected.id} />
          </div>
        </DetailPanel>
      )}

      {/* Status confirmation */}
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

      {previewInvoice && (
        <InvoicePreview open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)} invoice={previewInvoice} />
      )}
    </>
  );
}
