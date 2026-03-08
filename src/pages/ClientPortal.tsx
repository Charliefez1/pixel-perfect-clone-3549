import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";

export default function ClientPortal() {
  return (
    <>
      <PageHeader title="Client Portal" showFilter={false} />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Client Portal</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Client portal is coming soon. Your clients will be able to view projects, approve proposals, and access documents.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
