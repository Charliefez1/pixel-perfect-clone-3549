import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const timesheets = [
  { id: "1", period: "Mar 1 - Mar 7, 2026", hours: 38, status: "approved", submittedBy: "Charlie Watson" },
  { id: "2", period: "Mar 1 - Mar 7, 2026", hours: 42, status: "approved", submittedBy: "Rich Sheraton" },
  { id: "3", period: "Feb 22 - Feb 28, 2026", hours: 40, status: "approved", submittedBy: "Charlie Watson" },
  { id: "4", period: "Feb 22 - Feb 28, 2026", hours: 36, status: "approved", submittedBy: "Rich Sheraton" },
];

const statusStyles: Record<string, string> = {
  approved: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  pending: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  rejected: "bg-destructive/20 text-destructive",
};

export default function Timesheets() {
  return (
    <>
      <PageHeader title="Timesheets" searchPlaceholder="Search timesheets..." actionLabel="New Timesheet" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Period</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell className="pl-6 font-medium">{t.period}</TableCell>
                    <TableCell className="text-muted-foreground">{t.submittedBy}</TableCell>
                    <TableCell>{t.hours}h</TableCell>
                    <TableCell><Badge className={statusStyles[t.status]}>{t.status}</Badge></TableCell>
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
