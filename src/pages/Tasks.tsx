import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

  return (
    <>
      <PageHeader title="Tasks" searchPlaceholder="Search tasks..." actionLabel="New Task" />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
            {columns.map((col) => {
              const colTasks = tasks?.filter((t) => t.status === col.id) || [];
              return (
                <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2 flex-1">
                    {colTasks.map((task) => (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{task.title}</p>
                            <Badge className={`${priorityStyles[task.priority]} text-[10px] px-1.5 py-0.5 shrink-0`}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {task.projects?.name || "No project"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {task.due_date ? format(new Date(task.due_date), "MMM d") : "No due date"}
                            </span>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {task.assignee_id ? "A" : "?"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Add task
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
