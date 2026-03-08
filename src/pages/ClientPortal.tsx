import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, FileText, MessageSquare, FolderOpen, CheckCircle } from "lucide-react";

const features = [
  { icon: FolderOpen, title: "Project Overview", description: "Clients can view project status, milestones, and deliverables in real-time.", status: "coming" },
  { icon: FileText, title: "Proposals & Contracts", description: "Approve proposals and sign contracts directly from the portal.", status: "coming" },
  { icon: MessageSquare, title: "Communication", description: "Leave feedback, ask questions, and communicate with your team.", status: "coming" },
  { icon: CheckCircle, title: "Deliverable Sign-off", description: "Review and approve deliverables with built-in sign-off workflow.", status: "coming" },
];

export default function ClientPortal() {
  return (
    <>
      <PageHeader title="Client Portal" showFilter={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Globe className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Client Portal</h2>
              <p className="text-sm text-muted-foreground">A branded portal where your clients can track projects, approve proposals, and access documents.</p>
            </div>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><f.icon className="h-5 w-5 text-primary" /></div>
                  <Badge variant="secondary" className="text-xs">Planned</Badge>
                </div>
                <div>
                  <p className="font-medium text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">The client portal will give your clients a secure, branded space to interact with your projects. You'll be able to customise the portal with your branding and control what each client can see.</p>
            <Button variant="outline" disabled>Enable Client Portal (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
