import { useDeliveries } from "@/hooks/useDeliveries";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  materials_prep: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  scheduled: "bg-primary/20 text-primary",
  in_progress: "bg-blue-100 text-blue-700",
  delivered: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  follow_up: "bg-amber-100 text-amber-700",
  complete: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
};

export function DeliveriesTab({ projectId, dealId }: { projectId: string; dealId?: string | null }) {
  const { data: deliveries } = useDeliveries();
  const projectDeliveries = deliveries?.filter(
    (d) => d.project_id === projectId || (dealId && d.deal_id === dealId)
  ) || [];

  if (!projectDeliveries.length) {
    return <p className="text-sm text-muted-foreground">No deliveries linked to this project.</p>;
  }

  return (
    <div className="space-y-2">
      {projectDeliveries.map((d) => (
        <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-md border">
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{d.title}</p>
            {d.delivery_date && (
              <p className="text-xs text-muted-foreground">
                {new Date(d.delivery_date).toLocaleDateString("en-GB")}
              </p>
            )}
          </div>
          <Badge className={statusColors[d.status] || "bg-muted"}>{d.status.replace("_", " ")}</Badge>
        </div>
      ))}
    </div>
  );
}
