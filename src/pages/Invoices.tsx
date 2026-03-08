import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices } from "@/hooks/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  viewed: "bg-[hsl(var(--stage-qualified))]/20 text-[hsl(var(--stage-qualified))]",
  paid: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  overdue: "bg-destructive/20 text-destructive",
};

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();

  // Calculate summary stats
  const outstanding = invoices?.filter(i => i.status !== "paid").reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const overdue = invoices?.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.total || 0), 0) || 0;
  const paidThisMonth = invoices?.filter(i => {
    if (i.status !== "paid" || !i.paid_date) return false;
    const paidDate = new Date(i.paid_date);
    const now = new Date();
    return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
  }).reduce((sum, i) => sum + (i.total || 0), 0) || 0;

  return (
    <>
      <PageHeader
        title="Invoices"
        searchPlaceholder="Search invoices..."
        actionLabel="New Invoice"
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">£{outstanding.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Paid This Month</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">£{paidThisMonth.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Overdue</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-destructive">£{overdue.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !invoices?.length ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No invoices yet. Create your first invoice to get started.</p>
              </div>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer">
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.projects?.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.issue_date ? format(new Date(inv.issue_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">£{(inv.subtotal || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">£{(inv.vat_amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">£{(inv.total || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[inv.status]}>{inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
