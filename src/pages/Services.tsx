import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

const services = [
  { id: "1", name: "Leadership Development Programme", description: "Comprehensive leadership training", price: 25000, duration: "3 months", status: "active" },
  { id: "2", name: "Resilience Workshop", description: "Building mental resilience in teams", price: 5000, duration: "1 day", status: "active" },
  { id: "3", name: "Team Performance Coaching", description: "High-performance team development", price: 15000, duration: "6 weeks", status: "active" },
  { id: "4", name: "Mental Health First Aid Training", description: "MHFA certified training", price: 3500, duration: "2 days", status: "active" },
  { id: "5", name: "Executive Coaching", description: "1:1 coaching for senior leaders", price: 8000, duration: "12 sessions", status: "active" },
];

export default function Services() {
  return (
    <>
      <PageHeader title="Services" searchPlaceholder="Search services..." actionLabel="New Service" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
          {services.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary">{s.status}</Badge>
                </div>
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary">£{s.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">{s.duration}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
