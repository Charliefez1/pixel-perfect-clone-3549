import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const contracts = [
  { id: "1", title: "NHS Yorkshire Master Agreement", client: "NHS Yorkshire", value: 35000, status: "active", startDate: "Mar 1, 2026", endDate: "Feb 28, 2027" },
  { id: "2", title: "Barclays Workshop Contract", client: "Barclays", value: 45000, status: "pending", startDate: "—", endDate: "—" },
  { id: "3", title: "Deloitte Retainer Agreement", client: "Deloitte", value: 120000, status: "active", startDate: "Jan 1, 2026", endDate: "Dec 31, 2026" },
  { id: "4", title: "AstraZeneca Project SOW", client: "AstraZeneca", value: 52000, status: "expired", startDate: "Oct 1, 2025", endDate: "Jan 31, 2026" },
];

const statusStyles: Record<string, string> = {
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  pending: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  expired: "bg-muted text-muted-foreground",
};

export default function Contracts() {
  return (
    <>
      <PageHeader title="Contracts" searchPlaceholder="Search contracts..." actionLabel="New Contract" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Contract</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="pl-6 font-medium">{c.title}</TableCell>
                    <TableCell className="text-muted-foreground">{c.client}</TableCell>
                    <TableCell className="font-medium">£{c.value.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{c.startDate}</TableCell>
                    <TableCell className="text-muted-foreground">{c.endDate}</TableCell>
                    <TableCell><Badge className={statusStyles[c.status]}>{c.status}</Badge></TableCell>
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
