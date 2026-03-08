import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rateCards = [
  { id: "1", name: "Standard Consultancy", dayRate: 1500, hourlyRate: 200, currency: "GBP", status: "active" },
  { id: "2", name: "Premium Facilitation", dayRate: 2500, hourlyRate: 350, currency: "GBP", status: "active" },
  { id: "3", name: "Workshop Delivery", dayRate: 2000, hourlyRate: 275, currency: "GBP", status: "active" },
  { id: "4", name: "NHS Framework Rate", dayRate: 1200, hourlyRate: 160, currency: "GBP", status: "active" },
];

export default function RateCards() {
  return (
    <>
      <PageHeader title="Rate Cards" searchPlaceholder="Search rates..." actionLabel="New Rate Card" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Rate Card</TableHead>
                  <TableHead>Day Rate</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateCards.map((rc) => (
                  <TableRow key={rc.id} className="cursor-pointer">
                    <TableCell className="pl-6 font-medium">{rc.name}</TableCell>
                    <TableCell className="font-medium">£{rc.dayRate.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">£{rc.hourlyRate}</TableCell>
                    <TableCell className="text-muted-foreground">{rc.currency}</TableCell>
                    <TableCell><Badge variant="secondary">{rc.status}</Badge></TableCell>
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
