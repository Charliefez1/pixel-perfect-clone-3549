import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAutomations, useCreateAutomation, useUpdateAutomation, useDeleteAutomation, Automation } from "@/hooks/useAutomations";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Zap, Play, Pause, Trash2, Plus, ArrowRight, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const triggerEntities = [
  { value: "project", label: "Project" },
  { value: "delivery", label: "Delivery" },
  { value: "task", label: "Task" },
  { value: "invoice", label: "Invoice" },
];

const triggerEvents = [
  { value: "status_change", label: "Status Changes" },
  { value: "field_change", label: "Field Changes" },
  { value: "created", label: "Is Created" },
  { value: "date_reached", label: "Date Reached" },
];

const actionTypes = [
  { value: "update_field", label: "Update a Field" },
  { value: "create_task", label: "Create a Task" },
  { value: "send_notification", label: "Send Notification" },
  { value: "log_activity", label: "Log Activity" },
];

// Pre-built automation templates
const templates = [
  {
    name: "Auto-advance NEURO phase on delivery",
    description: "When a delivery status changes to 'complete', update the project's NEURO phase to the next stage.",
    trigger_entity: "delivery",
    trigger_event: "status_change",
    trigger_conditions: { to: "complete" },
    action_type: "update_field",
    action_config: { entity: "project", field: "neuro_phase", value: "next" },
  },
  {
    name: "Create follow-up task on session complete",
    description: "When a delivery is marked as delivered, automatically create a 'Send feedback form' task.",
    trigger_entity: "delivery",
    trigger_event: "status_change",
    trigger_conditions: { to: "delivered" },
    action_type: "create_task",
    action_config: { title: "Send feedback form", priority: "high", due_days: 2 },
  },
  {
    name: "Alert on overdue invoice",
    description: "When an invoice due date is reached and status is still 'sent', send a notification.",
    trigger_entity: "invoice",
    trigger_event: "date_reached",
    trigger_conditions: { field: "due_date", status: "sent" },
    action_type: "send_notification",
    action_config: { message: "Invoice is now overdue" },
  },
  {
    name: "Log activity on project stage change",
    description: "Whenever a project moves to a new pipeline stage, log an activity entry.",
    trigger_entity: "project",
    trigger_event: "field_change",
    trigger_conditions: { field: "stage" },
    action_type: "log_activity",
    action_config: { type: "stage_change" },
  },
];

export default function Automations() {
  const { data: automations, isLoading } = useAutomations();
  const createAuto = useCreateAutomation();
  const updateAuto = useUpdateAutomation();
  const deleteAuto = useDeleteAutomation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEntity, setTriggerEntity] = useState("project");
  const [triggerEvent, setTriggerEvent] = useState("status_change");
  const [conditionFrom, setConditionFrom] = useState("");
  const [conditionTo, setConditionTo] = useState("");
  const [actionType, setActionType] = useState("update_field");
  const [actionField, setActionField] = useState("");
  const [actionValue, setActionValue] = useState("");

  const resetForm = () => {
    setName(""); setDescription(""); setTriggerEntity("project"); setTriggerEvent("status_change");
    setConditionFrom(""); setConditionTo(""); setActionType("update_field"); setActionField(""); setActionValue("");
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    createAuto.mutate(
      {
        name,
        description: description || null,
        trigger_entity: triggerEntity,
        trigger_event: triggerEvent,
        trigger_conditions: { from: conditionFrom || undefined, to: conditionTo || undefined },
        action_type: actionType,
        action_config: { field: actionField || undefined, value: actionValue || undefined },
      },
      {
        onSuccess: () => {
          toast.success("Automation created");
          setDialogOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleCreateFromTemplate = (tmpl: typeof templates[0]) => {
    createAuto.mutate(
      {
        name: tmpl.name,
        description: tmpl.description,
        trigger_entity: tmpl.trigger_entity,
        trigger_event: tmpl.trigger_event,
        trigger_conditions: tmpl.trigger_conditions,
        action_type: tmpl.action_type,
        action_config: tmpl.action_config,
      },
      {
        onSuccess: () => {
          toast.success(`Created "${tmpl.name}"`);
          setTemplateDialog(false);
        },
      }
    );
  };

  const handleToggle = (auto: Automation) => {
    updateAuto.mutate(
      { id: auto.id, active: !auto.active },
      { onSuccess: () => toast.success(auto.active ? "Automation paused" : "Automation activated") }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAuto.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Automation deleted"); setDeleteTarget(null); },
    });
  };

  const activeCount = automations?.filter((a) => a.active).length || 0;
  const totalRuns = automations?.reduce((s, a) => s + (a.run_count || 0), 0) || 0;

  return (
    <>
      <PageHeader title="Automations" searchPlaceholder="Search automations..." actionLabel="New Automation" onAction={() => setDialogOpen(true)}>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => setTemplateDialog(true)}>
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Automations</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{automations?.length || 0}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold text-green-600">{activeCount}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Executions</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{totalRuns}</p>}</CardContent></Card>
        </div>

        {/* Automations list */}
        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : !automations?.length ? (
          <EmptyState icon={Zap} title="No automations yet" description="Create if/then rules to automate your workflow.">
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Custom Rule</Button>
              <Button variant="outline" onClick={() => setTemplateDialog(true)}><Zap className="h-4 w-4 mr-2" />From Template</Button>
            </div>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {automations.map((auto) => (
              <Card key={auto.id} className="group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${auto.active ? "bg-green-500/10" : "bg-muted"}`}>
                    <Zap className={`h-5 w-5 ${auto.active ? "text-green-500" : "text-muted-foreground"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{auto.name}</p>
                      {!auto.active && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                    </div>
                    {auto.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{auto.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>When <strong>{auto.trigger_entity}</strong> {auto.trigger_event.replace("_", " ")}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{auto.action_type.replace("_", " ")}</span>
                      {auto.run_count > 0 && <span>· {auto.run_count} runs</span>}
                      {auto.last_run_at && <span>· Last: {format(new Date(auto.last_run_at), "dd/MM HH:mm")}</span>}
                    </div>
                  </div>

                  <Switch checked={auto.active} onCheckedChange={() => handleToggle(auto)} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggle(auto)}>
                        {auto.active ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        {auto.active ? "Pause" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(auto)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Automation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Auto-create follow-up task" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this automation do?" rows={2} /></div>

            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">When…</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Entity</Label>
                  <Select value={triggerEntity} onValueChange={setTriggerEntity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{triggerEntities.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Event</Label>
                  <Select value={triggerEvent} onValueChange={setTriggerEvent}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{triggerEvents.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {triggerEvent === "status_change" && (
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="From status (optional)" value={conditionFrom} onChange={(e) => setConditionFrom(e.target.value)} />
                  <Input placeholder="To status" value={conditionTo} onChange={(e) => setConditionTo(e.target.value)} />
                </div>
              )}
            </div>

            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Then…</p>
              <div className="space-y-1">
                <Label className="text-xs">Action</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{actionTypes.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Field / Target" value={actionField} onChange={(e) => setActionField(e.target.value)} />
                <Input placeholder="Value" value={actionValue} onChange={(e) => setActionValue(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createAuto.isPending}>{createAuto.isPending ? "Creating..." : "Create Automation"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Automation Templates</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">Quick-start with pre-built automation rules.</p>
            {templates.map((tmpl, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateFromTemplate(tmpl)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-medium text-sm">{tmpl.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tmpl.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{tmpl.trigger_entity}</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="secondary" className="text-[10px]">{tmpl.action_type.replace("_", " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="automation" onConfirm={handleDelete} loading={deleteAuto.isPending} />
    </>
  );
}
