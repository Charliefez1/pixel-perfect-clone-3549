import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, CheckSquare } from "lucide-react";

const neuroPhases = ["Needs Analysis", "Explore", "Understand", "Realise", "Optimise"];

const projects = [
  { id: "1", title: "Barclays Leadership Programme", org: "Barclays", status: "Active", phase: 2, tasksComplete: 12, tasksTotal: 20, budget: 45000, invoiced: 22500, startDate: "2024-01-15", sessions: 8 },
  { id: "2", title: "Deloitte Wellbeing Series", org: "Deloitte", status: "Active", phase: 3, tasksComplete: 18, tasksTotal: 25, budget: 68000, invoiced: 51000, startDate: "2023-11-01", sessions: 12 },
  { id: "3", title: "NHS Yorkshire Resilience", org: "NHS Yorkshire", status: "Setup", phase: 0, tasksComplete: 2, tasksTotal: 15, budget: 35000, invoiced: 0, startDate: "2024-03-01", sessions: 0 },
  { id: "4", title: "AstraZeneca Team Performance", org: "AstraZeneca", status: "Active", phase: 1, tasksComplete: 6, tasksTotal: 18, budget: 52000, invoiced: 13000, startDate: "2024-02-10", sessions: 4 },
  { id: "5", title: "Google UK Neuro Workshop", org: "Google UK", status: "Completed", phase: 4, tasksComplete: 22, tasksTotal: 22, budget: 68000, invoiced: 68000, startDate: "2023-06-15", sessions: 16 },
];

const statusColors: Record<string, string> = {
  Setup: "bg-[hsl(var(--stage-lead))] text-primary-foreground",
  Active: "bg-primary text-primary-foreground",
  Paused: "bg-[hsl(var(--priority-medium))] text-foreground",
  Completed: "bg-[hsl(var(--stage-won))] text-primary-foreground",
};

export default function Projects() {
  return (
    <>
      <PageHeader
        title="Projects"
        searchPlaceholder="Search projects..."
        actionLabel="New Project"
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {projects.map((project) => {
          const taskPercent = Math.round((project.tasksComplete / project.tasksTotal) * 100);
          const phasePercent = ((project.phase + 1) / neuroPhases.length) * 100;
          return (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold truncate">{project.title}</h3>
                      <Badge className={statusColors[project.status]}>{project.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{project.org}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.startDate}</span>
                      <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{project.tasksComplete}/{project.tasksTotal} tasks</span>
                    </div>
                  </div>
                  <div className="w-full lg:w-56">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">NEURO Phase</span>
                      <span className="text-muted-foreground">
                        {project.phase < neuroPhases.length ? neuroPhases[project.phase] : "Complete"}
                      </span>
                    </div>
                    <Progress value={phasePercent} className="h-2" />
                  </div>
                  <div className="w-full lg:w-40 text-right">
                    <p className="text-sm font-bold">£{project.invoiced.toLocaleString()} <span className="text-muted-foreground font-normal">/ £{project.budget.toLocaleString()}</span></p>
                    <p className="text-xs text-muted-foreground">{project.sessions} sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
