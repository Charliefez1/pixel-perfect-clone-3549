import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rateCards = [
  { id: "1", name: "Standard Training Day", dayRate: 4500, halfDay: 2800, currency: "GBP", status: "active", notes: "Most workshops" },
  { id: "2", name: "Executive/Board Sessions", dayRate: 6500, halfDay: 4000, currency: "GBP", status: "active", notes: "C-suite & board" },
  { id: "3", name: "Consultancy Day Rate", dayRate: 2500, halfDay: 1400, currency: "GBP", status: "active", notes: "Strategy & audit work" },
  { id: "4", name: "1:1 Coaching Session", dayRate: 500, halfDay: null, currency: "GBP", status: "active", notes: "Per session" },
  { id: "5", name: "NHS Framework Rate", dayRate: 3200, halfDay: 1800, currency: "GBP", status: "active", notes: "Public sector" },
  { id: "6", name: "Keynote Speaking", dayRate: 5000, halfDay: 3500, currency: "GBP", status: "active", notes: "Conferences & events" },
  { id: "7", name: "Ask Away / Gen Z Sessions", dayRate: 5000, halfDay: 3000, currency: "GBP", status: "active", notes: "Lived experience Q&A" },
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
                  <TableHead>Half Day</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateCards.map((rc) => (
                  <TableRow key={rc.id} className="cursor-pointer">
                    <TableCell className="pl-6 font-medium">{rc.name}</TableCell>
                    <TableCell className="font-medium text-primary">£{rc.dayRate.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{rc.halfDay ? `£${rc.halfDay.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{rc.notes}</TableCell>
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
