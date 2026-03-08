import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const team = [
  { id: "1", name: "Charlie Watson", initials: "CW", role: "Director", utilization: 85, projects: 4 },
  { id: "2", name: "Rich Sheraton", initials: "RB", role: "Director", utilization: 72, projects: 3 },
];

export default function Resourcing() {
  return (
    <>
      <PageHeader title="Resourcing" searchPlaceholder="Search team..." />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-4">
          {team.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">{t.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role} • {t.projects} active projects</p>
                  </div>
                  <div className="w-48 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium">{t.utilization}%</span>
                    </div>
                    <Progress value={t.utilization} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
