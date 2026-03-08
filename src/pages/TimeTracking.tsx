import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function TimeTracking() {
  return (
    <>
      <PageHeader title="Time Tracking" searchPlaceholder="Search entries..." />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Time Tracking</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Time tracking is coming soon. You'll be able to log hours against projects and tasks with a built-in timer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
