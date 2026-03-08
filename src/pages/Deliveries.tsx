import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2 } from "lucide-react";
import { useDeliveries, useDeliveryTasks, useUpdateDeliveryTask, Delivery } from "@/hooks/useDeliveries";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, isPast } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const deliveryStatuses = [
  { id: "planning", label: "Planning", color: "bg-slate-400" },
  { id: "materials_prep", label: "Materials Prep", color: "bg-blue-400" },
  { id: "scheduled", label: "Scheduled", color: "bg-cyan-400" },
  { id: "in_progress", label: "In Progress", color: "bg-amber-400" },
  { id: "delivered", label: "Delivered", color: "bg-emerald-400" },
  { id: "follow_up", label: "Follow Up", color: "bg-purple-400" },
  { id: "complete", label: "Complete", color: "bg-green-500" },
];

const serviceTypeColors: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-700",
  programme: "bg-purple-100 text-purple-700",
  coaching: "bg-green-100 text-green-700",
  keynote: "bg-orange-100 text-orange-700",
  audit: "bg-teal-100 text-teal-700",
  sera_pilot: "bg-pink-100 text-pink-700",
};

function getSatisfactionColor(score: number | null): string {
  if (!score) return "bg-muted text-muted-foreground";
  if (score >= 9) return "bg-green-100 text-green-700";
  if (score >= 7) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function Deliveries() {
  const { data: deliveries, isLoading } = useDeliveries();
  const [view, setView] = useState<ViewMode>("board");
  const [selected, setSelected] = useState<Delivery | null>(null);

  // Stats
  const activeDeliveries = deliveries?.filter((d) => d.status !== "complete").length || 0;
  const avgSatisfaction = deliveries?.filter((d) => d.satisfaction_score).reduce((sum, d) => sum + (d.satisfaction_score || 0), 0) / (deliveries?.filter((d) => d.satisfaction_score).length || 1) || 0;

  return (
    <>
      <PageHeader title="Deliveries" searchPlaceholder="Search deliveries..." actionLabel="New Delivery">
        <ViewToggle value={view} onChange={setView} />
      </PageHeader>

      {/* Summary bar */}
      <div className="border-b bg-card/50 px-6 py-3 flex items-center gap-6 text-sm">
        <span><strong>{activeDeliveries}</strong> active deliveries</span>
        <span>Avg satisfaction: <strong>{avgSatisfaction.toFixed(1)}</strong>/10</span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-72 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : view === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)]">
            {deliveryStatuses.map((status) => {
              const statusDeliveries = deliveries?.filter((d) => d.status === status.id) || [];
              return (
                <div key={status.id} className="flex-shrink-0 w-72 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      <span className="text-sm font-semibold">{status.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{statusDeliveries.length}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {statusDeliveries.map((delivery) => (
                      <DeliveryCard key={delivery.id} delivery={delivery} onClick={() => setSelected(delivery)} />
                    ))}
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Add delivery
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {deliveries?.map((delivery) => (
              <Card key={delivery.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(delivery)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{delivery.title}</p>
                    <p className="text-xs text-muted-foreground">{delivery.organisations?.name || "No organisation"}</p>
                  </div>
                  {delivery.service_type && (
                    <Badge className={serviceTypeColors[delivery.service_type] || "bg-muted"}>{delivery.service_type}</Badge>
                  )}
                  <Badge variant="secondary">{deliveryStatuses.find((s) => s.id === delivery.status)?.label}</Badge>
                  {delivery.delivery_date && (
                    <span className="text-xs text-muted-foreground">{format(parseISO(delivery.delivery_date), "dd/MM/yyyy")}</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Delivery</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Satisfaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries?.map((delivery) => (
                  <TableRow key={delivery.id} className="cursor-pointer" onClick={() => setSelected(delivery)}>
                    <TableCell className="pl-6 font-medium">{delivery.title}</TableCell>
                    <TableCell className="text-muted-foreground">{delivery.organisations?.name || "—"}</TableCell>
                    <TableCell>
                      {delivery.service_type && (
                        <Badge className={serviceTypeColors[delivery.service_type] || "bg-muted"}>{delivery.service_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{deliveryStatuses.find((s) => s.id === delivery.status)?.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {delivery.delivery_date ? format(parseISO(delivery.delivery_date), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      {delivery.satisfaction_score ? (
                        <Badge className={getSatisfactionColor(delivery.satisfaction_score)}>{delivery.satisfaction_score}/10</Badge>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selected && (
        <DeliveryDetailPanel delivery={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function DeliveryCard({ delivery, onClick }: { delivery: Delivery; onClick: () => void }) {
  const { data: tasks } = useDeliveryTasks(delivery.id);
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight truncate">{delivery.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {delivery.organisations?.name || "No organisation"}
            </p>
          </div>
          {delivery.service_type && (
            <Badge className={cn("text-[10px] shrink-0", serviceTypeColors[delivery.service_type] || "bg-muted")}>
              {delivery.service_type}
            </Badge>
          )}
        </div>

        {delivery.delivery_date && (
          <p className="text-xs text-muted-foreground">
            {format(parseISO(delivery.delivery_date), "dd MMM yyyy")}
          </p>
        )}

        {totalTasks > 0 && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">{completedTasks}/{totalTasks} tasks</p>
          </div>
        )}

        {delivery.satisfaction_score && (
          <Badge className={cn("text-[10px]", getSatisfactionColor(delivery.satisfaction_score))}>
            {delivery.satisfaction_score}/10
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryDetailPanel({ delivery, onClose }: { delivery: Delivery; onClose: () => void }) {
  const { data: tasks } = useDeliveryTasks(delivery.id);
  const updateTask = useUpdateDeliveryTask();

  const handleToggleTask = (task: { id: string; status: string }) => {
    updateTask.mutate({
      id: task.id,
      status: task.status === "done" ? "todo" : "done",
    });
  };

  return (
    <DetailPanel
      open={!!delivery}
      onOpenChange={onClose}
      title={delivery.title}
      badge={{
        label: deliveryStatuses.find((s) => s.id === delivery.status)?.label || delivery.status,
        className: deliveryStatuses.find((s) => s.id === delivery.status)?.color,
      }}
      fields={[
        { label: "Organisation", value: delivery.organisations?.name },
        { label: "Service Type", value: delivery.service_type },
        { label: "Delivery Date", value: delivery.delivery_date ? format(parseISO(delivery.delivery_date), "dd/MM/yyyy") : undefined },
        { label: "Delegates", value: delivery.delegate_count?.toString() },
        { label: "Satisfaction", value: delivery.satisfaction_score ? `${delivery.satisfaction_score}/10` : undefined },
        { label: "NEURO Stage", value: delivery.neuro_stage },
        { label: "Kirkpatrick Level", value: delivery.kirkpatrick_level?.toString() },
        { label: "Notes", value: delivery.notes },
      ]}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium">Tasks</p>
        {!tasks?.length ? (
          <p className="text-sm text-muted-foreground">No tasks for this delivery.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md border",
                    task.status === "done" && "bg-muted/50",
                    isOverdue && "border-red-300 bg-red-50"
                  )}
                >
                  <Checkbox
                    checked={task.status === "done"}
                    onCheckedChange={() => handleToggleTask(task)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {task.assignee && <span className="capitalize">{task.assignee}</span>}
                      {task.due_date && (
                        <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                          {format(parseISO(task.due_date), "dd/MM")}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DetailPanel>
  );
}
