import { Task } from "@/hooks/useTasks";
import { format, differenceInDays, isSameDay, min as dateMin, max as dateMax } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskTimelineViewProps {
  tasks: Task[];
  onSelectTask: (t: Task) => void;
}

export function TaskTimelineView({ tasks, onSelectTask }: TaskTimelineViewProps) {
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

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: totalWidth + 300 }}>
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

        {tasksWithDates.map((task) => {
          const dueDate = new Date(task.due_date!);
          const dayOffset = differenceInDays(dueDate, startDate);
          const barLeft = dayOffset * dayWidth;

          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              aria-label={`Task: ${task.title}, due ${format(new Date(task.due_date!), "dd MMM yyyy")}`}
              className="flex items-center border-b border-border/50 hover:bg-muted/20 cursor-pointer"
              onClick={() => onSelectTask(task)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectTask(task); } }}
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
