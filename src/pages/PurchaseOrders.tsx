import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const purchaseOrders = [
  { id: "PO-001", vendor: "Venue Hire Ltd", description: "Conference room rental", amount: 1500, status: "approved", date: "Mar 5, 2026" },
  { id: "PO-002", vendor: "Print Solutions", description: "Workshop materials", amount: 450, status: "pending", date: "Mar 6, 2026" },
  { id: "PO-003", vendor: "Catering Co", description: "Event catering", amount: 2200, status: "approved", date: "Mar 4, 2026" },
];

const statusStyles: Record<string, string> = {
  approved: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  pending: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  rejected: "bg-destructive/20 text-destructive",
};

export default function PurchaseOrders() {
  return (
    <>
      <PageHeader title="Purchase Orders" searchPlaceholder="Search POs..." actionLabel="New PO" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">PO #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id} className="cursor-pointer">
                    <TableCell className="pl-6 font-medium">{po.id}</TableCell>
                    <TableCell>{po.vendor}</TableCell>
                    <TableCell className="text-muted-foreground">{po.description}</TableCell>
                    <TableCell className="font-medium">£{po.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{po.date}</TableCell>
                    <TableCell><Badge className={statusStyles[po.status]}>{po.status}</Badge></TableCell>
                    <TableCell><button className="text-muted-foreground hover:text-foreground">⋯</button></TableCell>
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
