import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const invoices = [
  { id: "INV-2024-042", client: "Barclays", project: "Leadership Programme", amount: 11250, vat: 2250, total: 13500, status: "Draft", date: "2024-03-05" },
  { id: "INV-2024-041", client: "Deloitte", project: "Wellbeing Series", amount: 8500, vat: 1700, total: 10200, status: "Paid", date: "2024-02-28" },
  { id: "INV-2024-040", client: "AstraZeneca", project: "Team Performance", amount: 13000, vat: 2600, total: 15600, status: "Sent", date: "2024-02-20" },
  { id: "INV-2024-039", client: "NHS Yorkshire", project: "Resilience", amount: 7000, vat: 1400, total: 8400, status: "Overdue", date: "2024-02-01" },
  { id: "INV-2024-038", client: "Google UK", project: "Neuro Workshop", amount: 17000, vat: 3400, total: 20400, status: "Paid", date: "2024-01-15" },
  { id: "INV-2024-037", client: "Unilever", project: "Mental Health First Aid", amount: 9250, vat: 1850, total: 11100, status: "Viewed", date: "2024-01-10" },
];

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-[hsl(var(--stage-lead))] text-primary-foreground",
  Viewed: "bg-[hsl(var(--stage-proposal))] text-foreground",
  Paid: "bg-primary text-primary-foreground",
  Overdue: "bg-destructive text-destructive-foreground",
};

export default function Invoices() {
  return (
    <>
      <PageHeader
        title="Invoices"
        searchPlaceholder="Search..."
        actionLabel="New Invoice"
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold">£42,300</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Paid This Month</p>
              <p className="text-2xl font-bold">£23,700</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive">£8,400</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer">
                    <TableCell className="font-medium">{inv.id}</TableCell>
                    <TableCell>{inv.client}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.project}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="text-right">£{inv.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">£{inv.vat.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">£{inv.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
