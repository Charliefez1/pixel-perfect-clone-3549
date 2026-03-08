import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const neuroPhases = ["N", "E", "U", "R", "O"] as const;
const phaseLabels: Record<string, string> = {
  N: "Needs",
  E: "Engage", 
  U: "Understand",
  R: "Realise",
  O: "Ongoing",
};

interface Project {
  id: string;
  name: string;
  client: string;
  status: "setup" | "active" | "paused" | "completed";
  phase: number; // 0-4 for N-E-U-R-O
  budget: number;
  invoiced: number;
  owner: string;
  sessions: number;
  nextSession?: string;
  serviceType: string;
}

const projects: Project[] = [
  { id: "1", name: "Neuroinclusion Strategy Review", client: "IBM", status: "active", phase: 2, budget: 85000, invoiced: 42500, owner: "RF", sessions: 8, nextSession: "Mar 15", serviceType: "Consultancy" },
  { id: "2", name: "Line Manager Training Programme", client: "Lloyds Bank", status: "active", phase: 3, budget: 48000, invoiced: 36000, owner: "RF", sessions: 6, nextSession: "Mar 11", serviceType: "Training" },
  { id: "3", name: "Champions Programme", client: "Transport for London", status: "active", phase: 2, budget: 55000, invoiced: 27500, owner: "RF", sessions: 12, nextSession: "Mar 14", serviceType: "Training" },
  { id: "4", name: "Gen Z Neurodiversity Series", client: "Sky", status: "setup", phase: 0, budget: 38000, invoiced: 0, owner: "CF", sessions: 4, serviceType: "Training" },
  { id: "5", name: "ADHD Workshop Programme", client: "Google UK", status: "active", phase: 4, budget: 42000, invoiced: 42000, owner: "RF", sessions: 5, serviceType: "Training" },
  { id: "6", name: "Executive Awareness Sessions", client: "Aviva", status: "completed", phase: 4, budget: 28000, invoiced: 28000, owner: "RF", sessions: 3, serviceType: "Training" },
  { id: "7", name: "NHS Manager Development", client: "NHS Blood & Transplant", status: "active", phase: 1, budget: 32000, invoiced: 8000, owner: "RF", sessions: 8, nextSession: "Mar 10", serviceType: "Training" },
  { id: "8", name: "Autism at Work Programme", client: "Royal Mail", status: "paused", phase: 2, budget: 45000, invoiced: 22500, owner: "RF", sessions: 6, serviceType: "Training" },
];

const statusStyles: Record<string, string> = {
  setup: "bg-muted text-muted-foreground",
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  paused: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  completed: "bg-primary/20 text-primary",
};

export default function Projects() {
  return (
    <>
      <PageHeader title="Projects" searchPlaceholder="Search projects..." actionLabel="New Project" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.client}</p>
                  </div>
                  <Badge className={statusStyles[p.status]}>{p.status}</Badge>
                </div>

                {/* NEURO Phase Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">NEURO Phase</span>
                    <span className="font-medium">{phaseLabels[neuroPhases[p.phase]]}</span>
                  </div>
                  <div className="flex gap-1">
                    {neuroPhases.map((letter, i) => (
                      <div
                        key={letter}
                        className={`flex-1 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                          i <= p.phase
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
                    <span className="font-medium">£{p.invoiced.toLocaleString()} / £{p.budget.toLocaleString()}</span>
                  </div>
                  <Progress value={(p.invoiced / p.budget) * 100} className="h-1.5" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.sessions} sessions</span>
                    {p.nextSession && (
                      <>
                        <span>•</span>
                        <span>Next: {p.nextSession}</span>
                      </>
                    )}
                  </div>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{p.owner}</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
