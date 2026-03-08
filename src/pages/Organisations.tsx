import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const organisations = [
  { id: "1", name: "NHS Yorkshire", sector: "Healthcare", contacts: 3, deals: 2, totalValue: 35000 },
  { id: "2", name: "Barclays", sector: "Finance", contacts: 2, deals: 1, totalValue: 45000 },
  { id: "3", name: "Deloitte", sector: "Professional Services", contacts: 4, deals: 3, totalValue: 68000 },
  { id: "4", name: "AstraZeneca", sector: "Pharma", contacts: 2, deals: 1, totalValue: 52000 },
  { id: "5", name: "Unilever", sector: "FMCG", contacts: 1, deals: 1, totalValue: 18500 },
];

export default function Organisations() {
  return (
    <>
      <PageHeader
        title="Clients"
        searchPlaceholder="Search..."
        actionLabel="New Client"
      />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Client ↕</TableHead>
                  <TableHead>Contact Name ↕</TableHead>
                  <TableHead>Contact Email ↕</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organisations.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                          {o.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-sm">{o.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.contacts} contacts</TableCell>
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.sector}</Badge>
                    </TableCell>
                    <TableCell>
                      <button className="text-muted-foreground hover:text-foreground">⋯</button>
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
