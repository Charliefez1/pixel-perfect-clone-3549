import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTasks, Task, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDialogs } from "@/App";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

const priorityStyles: Record<string, string> = {
  critical: "bg-[hsl(var(--priority-critical))] text-primary-foreground",
  high: "bg-[hsl(var(--priority-high))] text-primary-foreground",
  medium: "bg-[hsl(var(--priority-medium))] text-foreground",
  low: "bg-[hsl(var(--priority-low))] text-primary-foreground",
};

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [view, setView] = useState<ViewMode>("board");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { openCreateTask } = useDialogs();
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
    const task = tasks?.find((t) => t.id === id);
    if (!task || task.status === statusId) { setDraggedId(null); return; }
    updateTask.mutate(
      { id, status: statusId as any },
      { onSuccess: () => toast.success(`Moved "${task.title}" to ${columns.find(c => c.id === statusId)?.label}`) }
    );
    setDraggedId(null);
  }, [tasks, updateTask]);

  return (
    <>
      <PageHeader title="Tasks" searchPlaceholder="Search tasks..." actionLabel="New Task" onAction={openCreateTask}>
        <ViewToggle value={view} onChange={setView} />
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ))}
          </div>
        ) : view === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
            {columns.map((col) => {
              const colTasks = tasks?.filter((t) => t.status === col.id) || [];
              return (
                <div
                  key={col.id}
                  className={cn("flex-shrink-0 w-72 flex flex-col rounded-lg transition-colors", draggedId ? "bg-accent/30" : "")}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2 flex-1">
                    {colTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                        onClick={() => setSelectedTask(task)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{task.title}</p>
                            <Badge className={`${priorityStyles[task.priority]} text-[10px] px-1.5 py-0.5 shrink-0`}>{task.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{task.projects?.name || "No project"}</p>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {task.due_date ? format(new Date(task.due_date), "dd/MM") : "No due date"}
                            </span>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{task.assignee_id ? "A" : "?"}</AvatarFallback>
                            </Avatar>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={openCreateTask}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add task
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "list" ? (
          <div className="space-y-2">
            {tasks?.map((task) => (
              <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTask(task)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.projects?.name || "No project"}</p>
                  </div>
                  <Badge className={`${priorityStyles[task.priority]} text-[10px]`}>{task.priority}</Badge>
                  <Badge variant="secondary">{columns.find(c => c.id === task.status)?.label}</Badge>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "—"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks?.map((task) => (
                  <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <TableCell className="pl-6 font-medium">{task.title}</TableCell>
                    <TableCell className="text-muted-foreground">{task.projects?.name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{columns.find(c => c.id === task.status)?.label}</Badge></TableCell>
                    <TableCell><Badge className={`${priorityStyles[task.priority]} text-[10px]`}>{task.priority}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}

function TaskDetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editValues, setEditValues] = useState({
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || "",
    description: task.description || "",
  });

  const handleSave = () => {
    updateTask.mutate(
      { id: task.id, ...editValues, due_date: editValues.due_date || null },
      { onSuccess: () => { toast.success("Task updated"); setEditing(false); } }
    );
  };

  return (
    <DetailPanel
      open={!!task}
      onOpenChange={onClose}
      title={task.title}
      badge={{ label: task.priority, className: priorityStyles[task.priority] }}
      fields={editing ? [] : [
        { label: "Status", value: columns.find(c => c.id === task.status)?.label },
        { label: "Project", value: task.projects?.name },
        { label: "Due Date", value: task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : undefined },
        { label: "Description", value: task.description },
      ]}
    >
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={editValues.title} onChange={(e) => setEditValues({ ...editValues, title: e.target.value })} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={editValues.status} onValueChange={(v) => setEditValues({ ...editValues, status: v as any })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columns.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={editValues.priority} onValueChange={(v) => setEditValues({ ...editValues, priority: v as any })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["critical", "high", "medium", "low"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Due Date</label>
            <Input type="date" value={editValues.due_date} onChange={(e) => setEditValues({ ...editValues, due_date: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Description</label>
            <Textarea value={editValues.description} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateTask.isPending}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Task</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      )}
      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title={task.title}
        onConfirm={() => deleteTask.mutate(task.id, { onSuccess: () => { toast.success("Task deleted"); onClose(); }, onError: (e) => toast.error(e.message) })}
        loading={deleteTask.isPending} />
    </DetailPanel>
  );
}
