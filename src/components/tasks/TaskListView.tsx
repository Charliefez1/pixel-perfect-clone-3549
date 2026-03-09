import { useState } from "react";
import { Task, useCreateTask } from "@/hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

interface TaskListViewProps {
  parentTasks: Task[];
  subtasksByParent: Record<string, Task[]>;
  onSelectTask: (t: Task) => void;
}

export function TaskListView({ parentTasks, subtasksByParent, onSelectTask }: TaskListViewProps) {
  const createTask = useCreateTask();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

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
    const parent = parentTasks.find(t => t.id === parentId);
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

  return (
    <div className="space-y-1">
      {parentTasks.map((task) => {
        const subtasks = subtasksByParent[task.id] || [];
        const isExpanded = expandedParents.has(task.id);
        return (
          <div key={task.id}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelectTask(task)}>
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
              <Card key={sub.id} className="ml-10 mt-1 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => onSelectTask(sub)}>
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
  );
}
