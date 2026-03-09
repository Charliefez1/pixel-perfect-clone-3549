import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  Settings,
  Users,
  MessageSquare,
  Shield,
  Palette,
  Link2,
  Copy,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ClientPortal() {
  const { data: organisations, isLoading: orgsLoading } = useOrganisations();
  const { data: projects } = useProjects();
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [welcomeText, setWelcomeText] = useState(
    "Welcome to the NDG Hub client portal. Here you can track the progress of your projects, access documents, and communicate with your delivery team."
  );
  const [taskVisibility, setTaskVisibility] = useState<"hidden" | "view" | "view_comment">("view");
  const [showProgress, setShowProgress] = useState(true);
  const [clientMessaging, setClientMessaging] = useState(true);
  const [brandColour, setBrandColour] = useState("#7c3aed");
  const [portalClients, setPortalClients] = useState<Set<string>>(new Set());

  const togglePortalClient = (orgId: string) => {
    setPortalClients((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  const copyPortalLink = (orgId: string) => {
    const url = `${window.location.origin}/portal/${orgId}`;
    navigator.clipboard.writeText(url);
    toast.success("Portal link copied to clipboard");
  };

  return (
    <>
      <PageHeader title="Client Portal" showFilter={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Overview card */}
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Client Portal</h2>
              <p className="text-sm text-muted-foreground">
                A branded portal where clients can track projects, access documents, and communicate
                with your team.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Portal</span>
              <Switch
                checked={portalEnabled}
                onCheckedChange={(checked) => {
                  setPortalEnabled(checked);
                  toast.success(checked ? "Client portal enabled" : "Client portal disabled");
                }}
              />
              <Badge
                className={
                  portalEnabled
                    ? "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]"
                    : "bg-muted text-muted-foreground"
                }
              >
                {portalEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="access">
          <TabsList>
            <TabsTrigger value="access" className="gap-2">
              <Shield className="h-3.5 w-3.5" /> Access
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-3.5 w-3.5" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="portals" className="gap-2">
              <Users className="h-3.5 w-3.5" /> Portals ({portalClients.size})
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-3.5 w-3.5" /> Preview
            </TabsTrigger>
          </TabsList>

          {/* Access Tab */}
          <TabsContent value="access" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Magic Link Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Clients receive a secure login link via email — no password required.
                    </p>
                  </div>
                  <Badge className="bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]">
                    Default
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Portal Base URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${window.location.origin}/portal/`}
                      readOnly
                      className="flex-1 bg-muted/50 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/portal/`);
                        toast.success("URL copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Each client gets a unique portal URL: /portal/[client-id]
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Visibility</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "hidden", label: "Hidden", icon: EyeOff },
                      { value: "view", label: "View only", icon: Eye },
                      { value: "view_comment", label: "View & comment", icon: MessageSquare },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTaskVisibility(opt.value as any)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors",
                          taskVisibility === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Project Progress</p>
                    <p className="text-xs text-muted-foreground">Show project progress percentage</p>
                  </div>
                  <Switch checked={showProgress} onCheckedChange={setShowProgress} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Client Messaging</p>
                    <p className="text-xs text-muted-foreground">Allow clients to send messages</p>
                  </div>
                  <Switch checked={clientMessaging} onCheckedChange={setClientMessaging} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Welcome Message</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={welcomeText}
                  onChange={(e) => setWelcomeText(e.target.value)}
                  rows={4}
                  placeholder="Welcome text for the portal landing page..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This message appears on the client portal landing page.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <CardTitle className="text-base">Branding</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brand Colour</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColour}
                        onChange={(e) => setBrandColour(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border"
                      />
                      <Input
                        value={brandColour}
                        onChange={(e) => setBrandColour(e.target.value)}
                        className="flex-1 h-9 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <Button variant="outline" size="sm" className="w-full">
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground">Recommended: 200x60px PNG</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Header Image</Label>
                  <Button variant="outline" size="sm">
                    Upload Header Image
                  </Button>
                  <p className="text-xs text-muted-foreground">Recommended: 1300x200px</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portals Tab */}
          <TabsContent value="portals" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Manage portal access for each client organisation. Enable the portal and send an
              invite email.
            </p>
            {orgsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Client</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Portal Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organisations?.map((org) => {
                      const orgProjects =
                        projects?.filter((p) => p.organisation_id === org.id) || [];
                      const enabled = portalClients.has(org.id);
                      return (
                        <TableRow key={org.id}>
                          <TableCell className="pl-6 font-medium">{org.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {orgProjects.length} project{orgProjects.length !== 1 ? "s" : ""}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => togglePortalClient(org.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!enabled}
                                onClick={() => copyPortalLink(org.id)}
                                className="gap-1"
                              >
                                <Link2 className="h-3.5 w-3.5" />
                                Copy Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!enabled}
                                className="gap-1"
                                onClick={() => toast.success("Portal invite email sent")}
                              >
                                <Send className="h-3.5 w-3.5" />
                                Invite
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="pt-4">
            <Card>
              <CardContent className="p-0">
                <div
                  className="rounded-t-lg h-32 flex items-end p-6"
                  style={{ backgroundColor: brandColour + "20" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: brandColour }}
                    >
                      N
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">NDG Hub — Client Portal</h2>
                      <p className="text-xs text-muted-foreground">Sample Client Organisation</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-sm text-muted-foreground">{welcomeText}</p>
                  <Separator />
                  <h3 className="text-base font-semibold">Your Projects</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Neuroinclusion Workshop Programme", "Manager Training Series"].map(
                      (name, i) => (
                        <Card key={i}>
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{name}</p>
                              <Badge
                                className={
                                  i === 0
                                    ? "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]"
                                    : "bg-primary/20 text-primary"
                                }
                              >
                                {i === 0 ? "Active" : "Setup"}
                              </Badge>
                            </div>
                            {showProgress && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{i === 0 ? "65%" : "10%"}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: i === 0 ? "65%" : "10%",
                                      backgroundColor: brandColour,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>

                  {clientMessaging && (
                    <>
                      <Separator />
                      <h3 className="text-base font-semibold">Messages</h3>
                      <div className="space-y-3">
                        <div className="bg-primary/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-primary">NDG Team</span>
                            <span className="text-[10px] text-muted-foreground">2 days ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Hi! Just a quick update — we've completed the content build phase and the workshop is scheduled for next Tuesday.
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Client</span>
                            <span className="text-[10px] text-muted-foreground">1 day ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            That's great, thank you! We've confirmed the venue and sent calendar invites to all delegates.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Type a message..." className="flex-1" disabled />
                        <Button disabled>Send</Button>
                      </div>
                    </>
                  )}

                  <div className="text-center text-xs text-muted-foreground pt-4">
                    <Button variant="outline" size="sm" disabled>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
