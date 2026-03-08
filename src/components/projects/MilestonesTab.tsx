import { Checkbox } from "@/components/ui/checkbox";
import { useProjectMilestones, useToggleMilestone } from "@/hooks/useProjectMilestones";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";

export function MilestonesTab({ projectId }: { projectId: string }) {
  const { data: milestones, isLoading } = useProjectMilestones(projectId);
  const toggle = useToggleMilestone();

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>;

  const completed = milestones?.filter((m) => m.completed_at).length || 0;
  const total = milestones?.length || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{completed}/{total} complete</span>
        <span>{total - completed} remaining</span>
      </div>
      <div className="space-y-1">
        {milestones?.map((m) => {
          const done = !!m.completed_at;
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors ${done ? "bg-muted/30 border-border/50" : "border-border hover:bg-muted/20"}`}
            >
              <Checkbox
                checked={done}
                onCheckedChange={(checked) =>
                  toggle.mutate({ id: m.id, completed: !!checked })
                }
                disabled={toggle.isPending}
              />
              <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                {m.label}
              </span>
              {done && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(m.completed_at!).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
