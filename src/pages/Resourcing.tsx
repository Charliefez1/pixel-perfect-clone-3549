import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

const team = [
  { 
    id: "1", 
    name: "Rich Ferriman", 
    initials: "RF", 
    role: "Lead Consultant & Co-Founder",
    profile: "AuDHD + Dyslexic",
    utilization: 85, 
    projects: 6,
    sessionsThisMonth: 12,
    nextAvailable: "Mar 18"
  },
  { 
    id: "2", 
    name: "Charlie Ferriman", 
    initials: "CF", 
    role: "Gen Z Specialist & Co-Founder",
    profile: "ADHD",
    utilization: 68, 
    projects: 3,
    sessionsThisMonth: 6,
    nextAvailable: "Mar 13"
  },
];

const upcomingCapacity = [
  { week: "Mar 10-14", rf: 4, cf: 2 },
  { week: "Mar 17-21", rf: 3, cf: 3 },
  { week: "Mar 24-28", rf: 5, cf: 1 },
  { week: "Mar 31 - Apr 4", rf: 2, cf: 4 },
];

export default function Resourcing() {
  return (
    <>
      <PageHeader title="Resourcing" searchPlaceholder="Search..." />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Team Members */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Team</h2>
            {team.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">{t.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{t.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{t.profile}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{t.projects} active projects</span>
                        <span>•</span>
                        <span>{t.sessionsThisMonth} sessions this month</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Next available: {t.nextAvailable}
                        </span>
                      </div>
                    </div>
                    <div className="w-40 space-y-1">
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

          {/* Capacity Overview */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Sessions Scheduled (Next 4 Weeks)</h3>
              <div className="grid grid-cols-4 gap-4">
                {upcomingCapacity.map((week) => (
                  <div key={week.week} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">{week.week}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">RF</span>
                        <span className="font-medium">{week.rf}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CF</span>
                        <span className="font-medium">{week.cf}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
