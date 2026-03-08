import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function Services() {
  return (
    <>
      <PageHeader title="Services" searchPlaceholder="Search services..." />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Services</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Service catalogue is coming soon. You'll be able to manage your 50+ workshop catalogue with pricing and descriptions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
