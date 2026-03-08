import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, FileText, Calendar, MessageSquare } from "lucide-react";

export default function ClientPortal() {
  return (
    <>
      <PageHeader title="Client Portal" showFilter={false} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Portal Settings
              </CardTitle>
              <CardDescription>Configure your client-facing portal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up a branded portal where clients can view projects, documents, and communicate with your team.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center space-y-2">
                <FileText className="h-8 w-8 mx-auto text-primary" />
                <p className="font-medium">Documents</p>
                <p className="text-xs text-muted-foreground">Share files with clients</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center space-y-2">
                <Calendar className="h-8 w-8 mx-auto text-primary" />
                <p className="font-medium">Scheduling</p>
                <p className="text-xs text-muted-foreground">Client booking page</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-primary" />
                <p className="font-medium">Messages</p>
                <p className="text-xs text-muted-foreground">Client communication</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
