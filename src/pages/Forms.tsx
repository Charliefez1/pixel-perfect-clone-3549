import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Eye, Send } from "lucide-react";

const forms = [
  { id: "1", title: "Workshop Feedback Form", responses: 24, status: "active", lastResponse: "2 hours ago" },
  { id: "2", title: "Pre-Session Questionnaire", responses: 18, status: "active", lastResponse: "1 day ago" },
  { id: "3", title: "Client Intake Form", responses: 45, status: "active", lastResponse: "3 days ago" },
  { id: "4", title: "Post-Programme Survey", responses: 12, status: "draft", lastResponse: "—" },
];

export default function Forms() {
  return (
    <>
      <PageHeader title="Forms" searchPlaceholder="Search forms..." actionLabel="New Form" />
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
          {forms.map((f) => (
            <Card key={f.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={f.status === "active" ? "default" : "secondary"}>{f.status}</Badge>
                </div>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{f.responses} responses</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last response: {f.lastResponse}</span>
                  <div className="flex gap-2">
                    <Eye className="h-4 w-4 hover:text-foreground cursor-pointer" />
                    <Send className="h-4 w-4 hover:text-foreground cursor-pointer" />
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
