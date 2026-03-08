import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ViewToggle, ViewMode } from "@/components/layout/ViewToggle";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDialogs } from "@/App";

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
  const [view, setView] = useState<ViewMode>("board");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { openCreateTask } = useDialogs();

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
                <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2 flex-1">
                    {colTasks.map((task) => (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTask(task)}>
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
                    {task.due_date ? format(new Date(task.due_date), "MMM d") : "—"}
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
                    <TableCell className="text-muted-foreground">
                      {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {selectedTask && (
        <DetailPanel
          open={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
          title={selectedTask.title}
          badge={{ label: selectedTask.priority, className: priorityStyles[selectedTask.priority] }}
          fields={[
            { label: "Status", value: columns.find(c => c.id === selectedTask.status)?.label },
            { label: "Project", value: selectedTask.projects?.name },
            { label: "Due Date", value: selectedTask.due_date ? format(new Date(selectedTask.due_date), "MMM d, yyyy") : undefined },
            { label: "Description", value: selectedTask.description },
          ]}
        />
      )}
    </>
  );
}
