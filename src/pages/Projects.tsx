import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const neuroPhases = ["N", "E", "U", "R", "O"] as const;
const phaseLabels: Record<string, string> = {
  N: "Needs",
  E: "Engage", 
  U: "Understand",
  R: "Realise",
  O: "Ongoing",
};

const phaseToIndex: Record<string, number> = {
  needs: 0,
  engage: 1,
  understand: 2,
  realise: 3,
  ongoing: 4,
};

const statusStyles: Record<string, string> = {
  setup: "bg-muted text-muted-foreground",
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  paused: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  completed: "bg-primary/20 text-primary",
};

export default function Projects() {
  const { data: projects, isLoading } = useProjects();

  return (
    <>
      <PageHeader title="Projects" searchPlaceholder="Search projects..." actionLabel="New Project" />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : !projects?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No projects yet. Create your first project to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const phaseIndex = phaseToIndex[p.neuro_phase || "needs"] || 0;
              const invoiced = p.invoiced || 0;
              const budget = p.budget || 1;
              
              return (
                <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.organisations?.name || "No organisation"}
                        </p>
                      </div>
                      <Badge className={statusStyles[p.status]}>{p.status}</Badge>
                    </div>

                    {/* NEURO Phase Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">NEURO Phase</span>
                        <span className="font-medium">{phaseLabels[neuroPhases[phaseIndex]]}</span>
                      </div>
                      <div className="flex gap-1">
                        {neuroPhases.map((letter, i) => (
                          <div
                            key={letter}
                            className={`flex-1 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                              i <= phaseIndex
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {letter}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">
                          £{invoiced.toLocaleString()} / £{budget.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={(invoiced / budget) * 100} className="h-1.5" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {p.start_date && <span>Started: {new Date(p.start_date).toLocaleDateString()}</span>}
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {p.owner_id ? "U" : "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
