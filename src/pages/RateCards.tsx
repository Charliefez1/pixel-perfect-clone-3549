import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function RateCards() {
  return (
    <>
      <PageHeader title="Rate Cards" searchPlaceholder="Search rates..." />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Rate Cards</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Rate card management is coming soon. You'll be able to define day rates, half-day rates, and pricing tiers for all services.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
