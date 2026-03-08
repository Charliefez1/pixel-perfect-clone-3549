import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Users, Briefcase, MessageSquare } from "lucide-react";

const serviceCategories = [
  {
    id: "training",
    name: "Training & Development",
    description: "50+ accredited workshops from 60-minute awareness to full-day programmes",
    icon: Users,
    services: [
      { name: "Neurodiversity Awareness", duration: "60 min", price: 2500 },
      { name: "Line Manager Training", duration: "3 hours", price: 4500 },
      { name: "Executive Briefing", duration: "3 hours", price: 6500 },
      { name: "Champions Programme", duration: "3 hours", price: 4000 },
      { name: "HR Professional Training", duration: "3 hours", price: 4500 },
      { name: "ADHD in the Workplace", duration: "90 min", price: 3500 },
      { name: "Autism in the Workplace", duration: "90 min", price: 3500 },
      { name: "Ask Away with Rich Ferriman", duration: "90 min", price: 5000 },
      { name: "Gen Z Sessions with Charlie", duration: "90 min", price: 4500 },
    ],
  },
  {
    id: "consultancy",
    name: "Strategy & Consultancy",
    description: "Policy review, systems redesign, and neuroinclusion strategy",
    icon: Briefcase,
    services: [
      { name: "Neuroinclusion Audit", duration: "2-4 weeks", price: 15000 },
      { name: "Policy & Process Review", duration: "4-6 weeks", price: 22000 },
      { name: "Strategic Roadmap", duration: "6-8 weeks", price: 35000 },
      { name: "Centre of Excellence", duration: "12 months", price: 85000 },
    ],
  },
  {
    id: "coaching",
    name: "In-Work Coaching",
    description: "1:1 and group coaching for neurodivergent employees and managers",
    icon: MessageSquare,
    services: [
      { name: "1:1 Employee Coaching", duration: "6 sessions", price: 3000 },
      { name: "Manager Coaching", duration: "6 sessions", price: 4000 },
      { name: "Group Coaching Programme", duration: "8 weeks", price: 8000 },
    ],
  },
];

export default function Services() {
  return (
    <>
      <PageHeader title="Services" searchPlaceholder="Search services..." actionLabel="New Service" />
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8 max-w-5xl">
          {serviceCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{category.name}</h2>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service, i) => (
                  <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{service.duration}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">£{service.price.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
