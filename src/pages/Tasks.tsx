import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: "critical" | "high" | "medium" | "low";
  due: string;
  status: string;
}

const mockTasks: Task[] = [
  { id: "1", title: "Prepare proposal document", project: "NHS Yorkshire", assignee: "CW", priority: "critical", due: "Mar 8", status: "todo" },
  { id: "2", title: "Review session feedback forms", project: "Deloitte Wellbeing", assignee: "RB", priority: "medium", due: "Mar 10", status: "todo" },
  { id: "3", title: "Design workshop slides", project: "Barclays L&D", assignee: "CW", priority: "high", due: "Mar 9", status: "in_progress" },
  { id: "4", title: "Client follow-up call", project: "AstraZeneca", assignee: "RB", priority: "high", due: "Mar 8", status: "in_progress" },
  { id: "5", title: "Waiting on venue confirmation", project: "NHS Yorkshire", assignee: "CW", priority: "medium", due: "Mar 12", status: "blocked" },
  { id: "6", title: "Send final report", project: "Google UK", assignee: "RB", priority: "low", due: "Mar 7", status: "done" },
  { id: "7", title: "Invoice preparation", project: "Deloitte Wellbeing", assignee: "CW", priority: "medium", due: "Mar 6", status: "done" },
];

const priorityStyles: Record<string, string> = {
  critical: "bg-[hsl(var(--priority-critical))] text-primary-foreground",
  high: "bg-[hsl(var(--priority-high))] text-primary-foreground",
  medium: "bg-[hsl(var(--priority-medium))] text-foreground",
  low: "bg-[hsl(var(--priority-low))] text-primary-foreground",
};

export default function Tasks() {
  return (
    <>
      <TopBar title="Tasks" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
          {columns.map((col) => {
            const colTasks = mockTasks.filter((t) => t.status === col.id);
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
                        <p className="text-xs text-muted-foreground">{task.project}</p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />{task.due}
                          </span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{task.assignee}</AvatarFallback>
                          </Avatar>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
