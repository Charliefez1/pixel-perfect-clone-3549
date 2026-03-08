import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function PurchaseOrders() {
  return (
    <>
      <PageHeader title="Purchase Orders" searchPlaceholder="Search POs..." />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Purchase Orders</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Purchase order management is coming soon. You'll be able to track expenses for venues, materials, and catering.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
