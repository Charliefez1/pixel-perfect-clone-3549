import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const proposals = [
  { id: "1", title: "NHS Yorkshire Leadership Programme", client: "NHS Yorkshire", value: 35000, status: "sent", sentDate: "Mar 5, 2026" },
  { id: "2", title: "Barclays Resilience Workshop", client: "Barclays", value: 45000, status: "viewed", sentDate: "Mar 3, 2026" },
  { id: "3", title: "Deloitte Wellbeing Series", client: "Deloitte", value: 28000, status: "draft", sentDate: "—" },
  { id: "4", title: "AstraZeneca Team Performance", client: "AstraZeneca", value: 52000, status: "accepted", sentDate: "Feb 28, 2026" },
];

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  viewed: "bg-[hsl(var(--stage-qualified))]/20 text-[hsl(var(--stage-qualified))]",
  accepted: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
};

export default function Proposals() {
  return (
    <>
      <PageHeader title="Proposals" searchPlaceholder="Search proposals..." actionLabel="New Proposal" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Proposal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell className="pl-6 font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{p.client}</TableCell>
                    <TableCell className="font-medium">£{p.value.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sentDate}</TableCell>
                    <TableCell><Badge className={statusStyles[p.status]}>{p.status}</Badge></TableCell>
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
