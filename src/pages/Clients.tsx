import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const clients = [
  { id: "1", name: "NHS Blood & Transplant", sector: "Healthcare", contacts: 4, deals: 2, totalValue: 42000, status: "active" },
  { id: "2", name: "IBM", sector: "Technology", contacts: 3, deals: 1, totalValue: 85000, status: "active" },
  { id: "3", name: "Lloyds Bank", sector: "Financial Services", contacts: 5, deals: 3, totalValue: 120000, status: "active" },
  { id: "4", name: "Google UK", sector: "Technology", contacts: 2, deals: 2, totalValue: 68000, status: "active" },
  { id: "5", name: "Transport for London", sector: "Public Sector", contacts: 6, deals: 2, totalValue: 55000, status: "active" },
  { id: "6", name: "Sky", sector: "Media", contacts: 3, deals: 1, totalValue: 38000, status: "active" },
  { id: "7", name: "PayPal", sector: "Technology", contacts: 2, deals: 1, totalValue: 28000, status: "prospect" },
  { id: "8", name: "Aviva", sector: "Financial Services", contacts: 4, deals: 2, totalValue: 72000, status: "active" },
  { id: "9", name: "Royal Mail", sector: "Logistics", contacts: 3, deals: 1, totalValue: 45000, status: "active" },
  { id: "10", name: "University of Cambridge", sector: "Education", contacts: 2, deals: 1, totalValue: 32000, status: "prospect" },
];

const sectorColors: Record<string, string> = {
  Healthcare: "bg-[hsl(var(--stage-lead))]/20 text-[hsl(var(--stage-lead))]",
  Technology: "bg-[hsl(var(--stage-qualified))]/20 text-[hsl(var(--stage-qualified))]",
  "Financial Services": "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  "Public Sector": "bg-[hsl(var(--stage-negotiation))]/20 text-[hsl(var(--stage-negotiation))]",
  Media: "bg-[hsl(var(--stage-verbal))]/20 text-[hsl(var(--stage-verbal))]",
  Education: "bg-primary/20 text-primary",
  Logistics: "bg-muted text-muted-foreground",
};

export default function Clients() {
  return (
    <>
      <PageHeader title="Clients" searchPlaceholder="Search organisations..." actionLabel="New Client" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Organisation ↕</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Lifetime Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={sectorColors[c.sector] || "bg-muted text-muted-foreground"}>{c.sector}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{c.contacts}</TableCell>
                    <TableCell>{c.deals}</TableCell>
                    <TableCell className="font-medium">£{c.totalValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
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
