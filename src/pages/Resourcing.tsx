import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function Resourcing() {
  return (
    <>
      <PageHeader title="Resourcing" searchPlaceholder="Search..." />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <UserCog className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Resourcing</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Team resourcing is coming soon. You'll be able to see capacity, utilisation, and workload across the team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
