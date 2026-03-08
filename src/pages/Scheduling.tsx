import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export default function Scheduling() {
  return (
    <>
      <PageHeader title="Scheduling" />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <CalendarClock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Scheduling</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Client booking links are coming soon. You'll be able to share scheduling pages for discovery calls and sessions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
