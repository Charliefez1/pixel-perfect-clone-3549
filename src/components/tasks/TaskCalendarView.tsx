import { Task } from "@/hooks/useTasks";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskCalendarViewProps {
  tasks: Task[];
  date: Date;
  onDateChange: (d: Date) => void;
  onSelectTask: (t: Task) => void;
}

export function TaskCalendarView({ tasks, date, onDateChange, onSelectTask }: TaskCalendarViewProps) {
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
              role="button"
              tabIndex={0}
              aria-label={format(day, "EEEE, MMMM d, yyyy")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDateChange(day); } }}
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
