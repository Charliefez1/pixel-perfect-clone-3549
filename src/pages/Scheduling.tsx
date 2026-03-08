import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Link2, Clock } from "lucide-react";

const bookingLinks = [
  { id: "1", title: "30-Minute Discovery Call", duration: "30 min", bookings: 12 },
  { id: "2", title: "60-Minute Strategy Session", duration: "60 min", bookings: 8 },
  { id: "3", title: "Workshop Planning Meeting", duration: "90 min", bookings: 4 },
];

export default function Scheduling() {
  return (
    <>
      <PageHeader title="Scheduling" actionLabel="New Booking Link" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Booking Links
              </CardTitle>
              <CardDescription>Share these links to let clients book time with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookingLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.duration} • {link.bookings} bookings</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
