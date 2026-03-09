import { useState, useCallback } from "react";
import { CreateDeliveryDialog } from "@/components/dialogs/CreateDeliveryDialog";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, CheckCircle2, ClipboardList } from "lucide-react";
import { useDeliveries, useDeliveryTasks, useUpdateDeliveryTask, useUpdateDelivery, Delivery } from "@/hooks/useDeliveries";
import { useForms } from "@/hooks/useForms";
import { useLogActivity } from "@/hooks/useActivityLog";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, isPast } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const { data: forms } = useForms();
  const updateDelivery = useUpdateDelivery();
  const logActivity = useLogActivity();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("board");
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const activeDeliveries = deliveries?.filter((d) => d.status !== "complete").length || 0;
  const avgSatisfaction = deliveries?.filter((d) => d.satisfaction_score).reduce((sum, d) => sum + (d.satisfaction_score || 0), 0) / (deliveries?.filter((d) => d.satisfaction_score).length || 1) || 0;

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const delivery = deliveries?.find((d) => d.id === id);
    if (!delivery || delivery.status === statusId) { setDraggedId(null); return; }

    updateDelivery.mutate(
      { id, status: statusId as any },
      {
        onSuccess: () => {
          logActivity.mutate({
            entity_type: "delivery",
            entity_id: id,
            entity_title: delivery.title,
            action: "status_changed",
            metadata: { from: delivery.status, to: statusId },
          });
          const label = deliveryStatuses.find(s => s.id === statusId)?.label;
          if (statusId === "delivered") {
            const feedbackForms = forms?.filter(f => f.active && (f.type === "feedback" || f.type === "survey")) || [];
            if (feedbackForms.length > 0) {
              toast.success(`Session delivered! Send feedback form?`, {
                action: {
                  label: "Send Form",
                  onClick: () => {
                    const formUrl = `${window.location.origin}/form/${feedbackForms[0].id}`;
                    navigator.clipboard.writeText(formUrl);
                    toast.success("Feedback form link copied to clipboard");
                  },
                },
                duration: 8000,
              });
            } else {
              toast.success(`Moved "${delivery.title}" to ${label}`);
            }
          } else {
            toast.success(`Moved "${delivery.title}" to ${label}`);
          }
        },
      }
    );
    setDraggedId(null);
  }, [deliveries, updateDelivery, logActivity]);

  return (
    <>
      <PageHeader title="Deliveries" searchPlaceholder="Search deliveries..." actionLabel="New Delivery" onAction={() => navigate("/projects")}>
        <ViewToggle value={view} onChange={setView} />
      </PageHeader>

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
                <div
                  key={status.id}
                  className={cn("flex-shrink-0 w-72 flex flex-col rounded-lg transition-colors", draggedId ? "bg-accent/30" : "")}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      <span className="text-sm font-semibold">{status.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{statusDeliveries.length}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {statusDeliveries.map((delivery) => (
                      <DeliveryCard key={delivery.id} delivery={delivery} onClick={() => setSelected(delivery)} onDragStart={(e) => handleDragStart(e, delivery.id)} />
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
                  {delivery.service_type && <Badge className={serviceTypeColors[delivery.service_type] || "bg-muted"}>{delivery.service_type}</Badge>}
                  <Badge variant="secondary">{deliveryStatuses.find((s) => s.id === delivery.status)?.label}</Badge>
                  {delivery.delivery_date && <span className="text-xs text-muted-foreground">{format(parseISO(delivery.delivery_date), "dd/MM/yyyy")}</span>}
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
                    <TableCell>{delivery.service_type && <Badge className={serviceTypeColors[delivery.service_type] || "bg-muted"}>{delivery.service_type}</Badge>}</TableCell>
                    <TableCell><Badge variant="secondary">{deliveryStatuses.find((s) => s.id === delivery.status)?.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{delivery.delivery_date ? format(parseISO(delivery.delivery_date), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell>{delivery.satisfaction_score ? <Badge className={getSatisfactionColor(delivery.satisfaction_score)}>{delivery.satisfaction_score}/10</Badge> : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selected && <DeliveryDetailPanel delivery={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function DeliveryCard({ delivery, onClick, onDragStart }: { delivery: Delivery; onClick: () => void; onDragStart: (e: React.DragEvent) => void }) {
  const { data: tasks } = useDeliveryTasks(delivery.id);
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing" onClick={onClick} draggable onDragStart={onDragStart}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight truncate">{delivery.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{delivery.organisations?.name || "No organisation"}</p>
          </div>
          {delivery.service_type && (
            <Badge className={cn("text-[10px] shrink-0", serviceTypeColors[delivery.service_type] || "bg-muted")}>{delivery.service_type}</Badge>
          )}
        </div>
        {delivery.delivery_date && <p className="text-xs text-muted-foreground">{format(parseISO(delivery.delivery_date), "dd MMM yyyy")}</p>}
        {totalTasks > 0 && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">{completedTasks}/{totalTasks} tasks</p>
          </div>
        )}
        {delivery.satisfaction_score && <Badge className={cn("text-[10px]", getSatisfactionColor(delivery.satisfaction_score))}>{delivery.satisfaction_score}/10</Badge>}
      </CardContent>
    </Card>
  );
}

function DeliveryDetailPanel({ delivery, onClose }: { delivery: Delivery; onClose: () => void }) {
  const { data: tasks } = useDeliveryTasks(delivery.id);
  const updateTask = useUpdateDeliveryTask();
  const updateDelivery = useUpdateDelivery();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    status: delivery.status,
    delivery_date: delivery.delivery_date || "",
    delegate_count: delivery.delegate_count?.toString() || "",
    satisfaction_score: delivery.satisfaction_score?.toString() || "",
    neuro_stage: delivery.neuro_stage || "",
    notes: delivery.notes || "",
  });

  const handleToggleTask = (task: { id: string; status: string }) => {
    updateTask.mutate({ id: task.id, status: task.status === "done" ? "todo" : "done" });
  };

  const handleSave = () => {
    updateDelivery.mutate(
      {
        id: delivery.id,
        status: editValues.status as any,
        delivery_date: editValues.delivery_date || null,
        delegate_count: parseInt(editValues.delegate_count) || null,
        satisfaction_score: parseFloat(editValues.satisfaction_score) || null,
        neuro_stage: editValues.neuro_stage || null,
        notes: editValues.notes || null,
      },
      {
        onSuccess: () => {
          toast.success("Delivery updated");
          setEditing(false);
        },
      }
    );
  };

  return (
    <DetailPanel
      open={!!delivery}
      onOpenChange={onClose}
      title={delivery.title}
      badge={{ label: deliveryStatuses.find((s) => s.id === delivery.status)?.label || delivery.status, className: deliveryStatuses.find((s) => s.id === delivery.status)?.color }}
      fields={editing ? [] : [
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
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={editValues.status} onValueChange={(v) => setEditValues({ ...editValues, status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {deliveryStatuses.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Delivery Date</label>
              <Input type="date" value={editValues.delivery_date} onChange={(e) => setEditValues({ ...editValues, delivery_date: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Delegates</label>
              <Input type="number" value={editValues.delegate_count} onChange={(e) => setEditValues({ ...editValues, delegate_count: e.target.value })} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Satisfaction (/10)</label>
              <Input type="number" value={editValues.satisfaction_score} onChange={(e) => setEditValues({ ...editValues, satisfaction_score: e.target.value })} className="h-9" min="0" max="10" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">NEURO Stage</label>
              <Select value={editValues.neuro_stage} onValueChange={(v) => setEditValues({ ...editValues, neuro_stage: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {["needs", "engage", "understand", "redesign", "optimise"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes</label>
            <Textarea value={editValues.notes} onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setEditing(true)}>Edit Delivery</Button>
      )}

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
          <TabsTrigger value="feedback" className="flex-1">Feedback</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="pt-4">
          {!tasks?.length ? (
            <p className="text-sm text-muted-foreground">No tasks for this delivery.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";
                return (
                  <div key={task.id} className={cn("flex items-center gap-3 p-2 rounded-md border", task.status === "done" && "bg-muted/50", isOverdue && "border-red-300 bg-red-50")}>
                    <Checkbox checked={task.status === "done"} onCheckedChange={() => handleToggleTask(task)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {task.assignee && <span className="capitalize">{task.assignee}</span>}
                        {task.due_date && <span className={isOverdue ? "text-red-600 font-medium" : ""}>{format(parseISO(task.due_date), "dd/MM")}</span>}
                      </div>
                    </div>
                    {task.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="feedback" className="pt-4 space-y-4">
          <SendFeedbackFormButton deliveryId={delivery.id} />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pre-assessment complete</span>
              <Switch checked={delivery.pre_assessment_complete || false} onCheckedChange={(v) => updateDelivery.mutate({ id: delivery.id, pre_assessment_complete: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Post-assessment complete</span>
              <Switch checked={delivery.post_assessment_complete || false} onCheckedChange={(v) => updateDelivery.mutate({ id: delivery.id, post_assessment_complete: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Feedback form sent</span>
              <Switch checked={delivery.feedback_sent || false} onCheckedChange={(v) => updateDelivery.mutate({ id: delivery.id, feedback_sent: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Feedback received</span>
              <Switch checked={delivery.feedback_received || false} onCheckedChange={(v) => updateDelivery.mutate({ id: delivery.id, feedback_received: v })} />
            </div>
          </div>
          {delivery.satisfaction_score && (
            <div className="p-3 rounded-lg bg-muted text-center">
              <p className="text-2xl font-bold">{delivery.satisfaction_score}/10</p>
              <p className="text-xs text-muted-foreground">Satisfaction Score</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <p className="text-sm text-muted-foreground">Document uploads coming soon.</p>
        </TabsContent>
      </Tabs>
    </DetailPanel>
  );
}

function SendFeedbackFormButton({ deliveryId }: { deliveryId: string }) {
  const { data: forms } = useForms();
  const feedbackForms = forms?.filter(f => f.active && (f.type === "feedback" || f.type === "survey")) || [];

  if (!feedbackForms.length) return null;

  const handleCopyLink = () => {
    const formUrl = `${window.location.origin}/form/${feedbackForms[0].id}`;
    navigator.clipboard.writeText(formUrl);
    toast.success("Feedback form link copied to clipboard");
  };

  return (
    <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCopyLink}>
      <ClipboardList className="h-4 w-4" />
      Copy Feedback Form Link
    </Button>
  );
}
