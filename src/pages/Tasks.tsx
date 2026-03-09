import { useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks, Task, useUpdateTask, useDeleteTask, useCreateTask } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, differenceInDays, min as dateMin, max as dateMax } from "date-fns";
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
  const createTask = useCreateTask();
  const [view, setView] = useState<ViewMode>("board");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const { openCreateTask } = useDialogs();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  // Separate parent tasks and subtasks
  const parentTasks = useMemo(() => tasks?.filter(t => !(t as any).parent_task_id) || [], [tasks]);
  const subtasksByParent = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks?.forEach(t => {
      const parentId = (t as any).parent_task_id;
      if (parentId) {
        if (!map[parentId]) map[parentId] = [];
        map[parentId].push(t);
      }
    });
    return map;
  }, [tasks]);

  const toggleExpanded = (taskId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleAddSubtask = (parentId: string) => {
    if (!subtaskTitle.trim()) return;
    const parent = tasks?.find(t => t.id === parentId);
    createTask.mutate(
      {
        title: subtaskTitle,
        project_id: parent?.project_id || null,
        parent_task_id: parentId,
      } as any,
      {
        onSuccess: () => {
          toast.success("Subtask added");
          setSubtaskTitle("");
          setAddingSubtaskFor(null);
          setExpandedParents(prev => new Set(prev).add(parentId));
        },
      }
    );
  };

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

  const getSubtaskCount = (taskId: string) => subtasksByParent[taskId]?.length || 0;

  return (
    <>
      <PageHeader title="Tasks" searchPlaceholder="Search tasks..." actionLabel="New Task" onAction={openCreateTask}>
        <ViewToggle value={view} onChange={setView} showCalendar />
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
          /* ── Board View ── */
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
            {columns.map((col) => {
              const colTasks = parentTasks.filter((t) => t.status === col.id);
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
                    {colTasks.map((task) => {
                      const subtaskCount = getSubtaskCount(task.id);
                      return (
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
                              <div className="flex items-center gap-2">
                                {subtaskCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground">{subtaskCount} subtasks</span>
                                )}
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{task.assignee_id ? "A" : "?"}</AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
          /* ── List View with Subtasks ── */
          <div className="space-y-1">
            {parentTasks.map((task) => {
              const subtasks = subtasksByParent[task.id] || [];
              const isExpanded = expandedParents.has(task.id);
              return (
                <div key={task.id}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTask(task)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {subtasks.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpanded(task.id); }}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      )}
                      {subtasks.length === 0 && <div className="w-4" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.projects?.name || "No project"}</p>
                      </div>
                      {subtasks.length > 0 && (
                        <span className="text-xs text-muted-foreground">{subtasks.length} subtasks</span>
                      )}
                      <Badge className={`${priorityStyles[task.priority]} text-[10px]`}>{task.priority}</Badge>
                      <Badge variant="secondary">{columns.find(c => c.id === task.status)?.label}</Badge>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        {task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "—"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingSubtaskFor(task.id);
                          setExpandedParents(prev => new Set(prev).add(task.id));
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Subtask
                      </Button>
                    </CardContent>
                  </Card>
                  {isExpanded && subtasks.map((sub) => (
                    <Card key={sub.id} className="ml-10 mt-1 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedTask(sub)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-1 h-4 rounded-full bg-muted-foreground/20" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{sub.title}</p>
                        </div>
                        <Badge className={`${priorityStyles[sub.priority]} text-[10px]`}>{sub.priority}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{columns.find(c => c.id === sub.status)?.label}</Badge>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {sub.due_date ? format(new Date(sub.due_date), "dd/MM/yyyy") : "—"}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                  {addingSubtaskFor === task.id && (
                    <div className="ml-10 mt-1 flex items-center gap-2">
                      <Input
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        placeholder="Subtask title..."
                        className="flex-1 h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubtask(task.id);
                          if (e.key === "Escape") { setAddingSubtaskFor(null); setSubtaskTitle(""); }
                        }}
                      />
                      <Button size="sm" onClick={() => handleAddSubtask(task.id)} disabled={createTask.isPending}>Add</Button>
                      <Button size="sm" variant="outline" onClick={() => { setAddingSubtaskFor(null); setSubtaskTitle(""); }}>Cancel</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : view === "table" ? (
          /* ── Table View ── */
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentTasks.map((task) => {
                  const subtasks = subtasksByParent[task.id] || [];
                  const isExpanded = expandedParents.has(task.id);
                  return (
                    <>
                      <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelectedTask(task)}>
                        <TableCell className="pl-6 font-medium">
                          <div className="flex items-center gap-2">
                            {subtasks.length > 0 && (
                              <button onClick={(e) => { e.stopPropagation(); toggleExpanded(task.id); }}>
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            <span>{task.title}</span>
                            {subtasks.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">({subtasks.length})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{task.projects?.name || "—"}</TableCell>
                        <TableCell>
                          <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{task.assignee_id ? "A" : "?"}</AvatarFallback></Avatar>
                        </TableCell>
                        <TableCell><Badge className={`${priorityStyles[task.priority]} text-[10px]`}>{task.priority}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{columns.find(c => c.id === task.status)?.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{task.due_date ? format(new Date(task.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                      </TableRow>
                      {isExpanded && subtasks.map((sub) => (
                        <TableRow key={sub.id} className="cursor-pointer bg-muted/20" onClick={() => setSelectedTask(sub)}>
                          <TableCell className="pl-14 text-sm">{sub.title}</TableCell>
                          <TableCell className="text-muted-foreground">{sub.projects?.name || "—"}</TableCell>
                          <TableCell>
                            <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{sub.assignee_id ? "A" : "?"}</AvatarFallback></Avatar>
                          </TableCell>
                          <TableCell><Badge className={`${priorityStyles[sub.priority]} text-[9px]`}>{sub.priority}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{columns.find(c => c.id === sub.status)?.label}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{sub.due_date ? format(new Date(sub.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : view === "timeline" ? (
          /* ── Timeline / Gantt View ── */
          <TimelineView tasks={parentTasks} subtasksByParent={subtasksByParent} onSelectTask={setSelectedTask} />
        ) : (
          /* ── Calendar View ── */
          <CalendarView
            tasks={tasks || []}
            date={calendarDate}
            onDateChange={setCalendarDate}
            onSelectTask={setSelectedTask}
          />
        )}
      </div>

      {selectedTask && <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}

/* ── Timeline View ── */
function TimelineView({
  tasks,
  subtasksByParent,
  onSelectTask,
}: {
  tasks: Task[];
  subtasksByParent: Record<string, Task[]>;
  onSelectTask: (t: Task) => void;
}) {
  const tasksWithDates = tasks.filter(t => t.due_date);
  if (!tasksWithDates.length) {
    return <div className="text-center text-muted-foreground py-12">No tasks with due dates to show on timeline.</div>;
  }

  const allDates = tasksWithDates.map(t => new Date(t.due_date!));
  const earliest = dateMin(allDates);
  const latest = dateMax(allDates);
  const totalDays = Math.max(differenceInDays(latest, earliest), 1) + 14;
  const startDate = new Date(earliest);
  startDate.setDate(startDate.getDate() - 7);

  const dayWidth = 24;
  const totalWidth = totalDays * dayWidth;

  // Generate day markers
  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth + 300 }}>
        {/* Day headers */}
        <div className="flex border-b border-border sticky top-0 bg-background z-10">
          <div className="w-[280px] shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r">Task</div>
          <div className="flex-1 flex">
            {days.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "text-center text-[9px] py-1 border-r border-border/30",
                  d.getDay() === 0 || d.getDay() === 6 ? "bg-muted/30" : "",
                  isSameDay(d, new Date()) ? "bg-primary/10" : ""
                )}
                style={{ width: dayWidth }}
              >
                {d.getDate() === 1 || i === 0
                  ? <span className="font-semibold">{format(d, "MMM")}</span>
                  : format(d, "d")}
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {tasksWithDates.map((task) => {
          const dueDate = new Date(task.due_date!);
          const dayOffset = differenceInDays(dueDate, startDate);
          const barLeft = dayOffset * dayWidth;

          return (
            <div
              key={task.id}
              className="flex items-center border-b border-border/50 hover:bg-muted/20 cursor-pointer"
              onClick={() => onSelectTask(task)}
            >
              <div className="w-[280px] shrink-0 px-3 py-2 border-r">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-[10px] text-muted-foreground">{task.projects?.name}</p>
              </div>
              <div className="flex-1 relative h-10">
                <div
                  className={cn(
                    "absolute top-2 h-6 rounded-md flex items-center px-2 text-[10px] font-medium text-white",
                    task.status === "done" ? "bg-green-500" :
                    task.status === "blocked" ? "bg-red-500" :
                    task.status === "in_progress" ? "bg-blue-500" :
                    "bg-primary"
                  )}
                  style={{ left: barLeft, minWidth: dayWidth * 3 }}
                >
                  {format(dueDate, "dd MMM")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Calendar View ── */
function CalendarView({
  tasks,
  date,
  onDateChange,
  onSelectTask,
}: {
  tasks: Task[];
  date: Date;
  onDateChange: (d: Date) => void;
  onSelectTask: (t: Task) => void;
}) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(date, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => onDateChange(subMonths(date, 1))}>Prev</Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(addMonths(date, 1))}>Next</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
          <div key={day} className="px-2 py-2 text-xs font-semibold text-muted-foreground text-center bg-muted/30 border-b">{day}</div>
        ))}
        {calDays.map((day) => {
          const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, date);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] border-b border-r border-border/50 p-1",
                !isCurrentMonth && "bg-muted/20",
                isToday && "bg-primary/5"
              )}
            >
              <p className={cn(
                "text-xs mb-1",
                isToday ? "font-bold text-primary" : "text-muted-foreground",
                !isCurrentMonth && "opacity-40"
              )}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className={cn(
                      "w-full text-left text-[10px] px-1 py-0.5 rounded truncate",
                      task.status === "done" ? "bg-green-100 text-green-700" :
                      task.status === "blocked" ? "bg-red-100 text-red-700" :
                      task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      "bg-primary/10 text-primary"
                    )}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[9px] text-muted-foreground text-center">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Task Detail Panel ── */
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
