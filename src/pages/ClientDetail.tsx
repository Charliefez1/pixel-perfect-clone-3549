import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAIContext } from "@/hooks/useAIContext";
import { useOrganisation } from "@/hooks/useOrganisations";
import { useProjects } from "@/hooks/useProjects";
import { useContacts } from "@/hooks/useContacts";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDialogs } from "@/App";
import { isPast } from "date-fns";
import {
  ArrowLeft,
  Building2,
  FolderKanban,
  Users,
  Receipt,
  Plus,
  Globe,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const neuroPhases = ["N", "E", "U", "R", "O"] as const;
const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, redesign: 3, optimise: 4 };
export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useOrganisation(id);
  const { data: allProjects } = useProjects();
  const { data: allContacts } = useContacts();
  const { data: allInvoices } = useInvoices();
  const { openCreateProject } = useDialogs();
  const { setContext } = useAIContext();

  useEffect(() => {
    if (client) {
      setContext({
        page: "client_detail",
        entityType: "organisation",
        entityId: client.id,
        entityName: client.name,
        data: { industry: (client as any).industry, website: (client as any).website },
      });
    }
    return () => setContext(null);
  }, [client, setContext]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Client not found.</p>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const clientProjects = allProjects?.filter((p) => p.organisation_id === id) || [];
  const clientContacts = allContacts?.filter((c) => c.organisation_id === id) || [];
  const clientInvoices = allInvoices?.filter((i) => i.organisation_id === id) || [];

  const activeProjects = clientProjects.filter((p) => p.status === "active");
  const totalRevenue = clientProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalInvoiced = clientInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const paidInvoices = clientInvoices.filter((i) => i.status === "paid");
  const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const outstandingInvoices = clientInvoices.filter((i) => i.status !== "paid");
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const overdueInvoices = clientInvoices.filter((i) => i.status === "overdue" || (i.status === "sent" && i.due_date && isPast(new Date(i.due_date))));
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/clients")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Clients
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{client.name}</h1>
                  {activeProjects.length > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </span>
                  )}
                </div>
                {client.sector && (
                  <Badge variant="secondary" className="mt-0.5">{client.sector}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button size="sm" onClick={openCreateProject}>
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </div>

        {/* Client info row */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
          {client.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {client.email}
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {client.phone}
            </span>
          )}
          {client.website && (
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {client.website}
            </span>
          )}
          {client.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {client.address}
            </span>
          )}
        </div>
      </div>

      {/* Tabbed content */}
      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({clientContacts.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({clientProjects.length})</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Overview Tab — Two-column layout */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{clientProjects.length}</p>
                    <p className="text-xs text-muted-foreground">Total Projects</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{clientContacts.length}</p>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(142,71%,45%)]/10 flex items-center justify-center text-[hsl(142,71%,45%)]">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">£{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${outstandingTotal > 0 ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">£{outstandingTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left column — Recent projects + notes */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Projects */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        Recent Projects
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={openCreateProject}>
                        <Plus className="h-4 w-4 mr-1" />
                        New Project
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientProjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No projects yet for this client.</p>
                    ) : (
                      <div className="space-y-2">
                        {clientProjects.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 p-2.5 rounded-md border cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => navigate(`/projects/${p.id}`)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{(p as any).service_type || "—"}</p>
                            </div>
                            <StatusBadge status={p.status} />
                            <span className="text-sm font-semibold text-primary">£{(p.budget || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right column — sidebar */}
              <div className="space-y-4">
                {/* Default Contact */}
                {clientContacts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Default Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="font-medium">{clientContacts[0].first_name} {clientContacts[0].last_name}</p>
                      {clientContacts[0].job_title && (
                        <p className="text-muted-foreground">{clientContacts[0].job_title}</p>
                      )}
                      {clientContacts[0].email && (
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {clientContacts[0].email}
                        </p>
                      )}
                      {clientContacts[0].phone && (
                        <p className="text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {clientContacts[0].phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Details */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {client.website && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Website</span>
                        <span className="font-medium truncate max-w-[60%]">{client.website}</span>
                      </div>
                    )}
                    {client.sector && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sector</span>
                        <span className="font-medium">{client.sector}</span>
                      </div>
                    )}
                    {client.address && (
                      <div>
                        <span className="text-muted-foreground">Address</span>
                        <p className="font-medium mt-0.5">{client.address}</p>
                      </div>
                    )}
                    {client.vat_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">VAT Number</span>
                        <span className="font-medium">{client.vat_number}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financials snapshot */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Financials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Revenue</span>
                      <span className="font-semibold">£{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-medium text-[hsl(142,71%,45%)]">£{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className={`font-medium ${outstandingTotal > 0 ? "text-amber-500" : ""}`}>
                        £{outstandingTotal.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            {clientContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No contacts yet for this client.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clientContacts.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                          {c.job_title && <p className="text-xs text-muted-foreground truncate">{c.job_title}</p>}
                        </div>
                      </div>
                      {c.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={openCreateProject}>
                <Plus className="h-4 w-4 mr-1" />
                New Project
              </Button>
            </div>
            {clientProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No projects yet for this client.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {clientProjects.map((p) => {
                  const phaseIndex = phaseToIndex[p.neuro_phase || "needs"] || 0;
                  return (
                    <Card
                      key={p.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                            )}
                          </div>
                          <StatusBadge status={p.status} />
                        </div>

                        {/* NEURO phase mini bar */}
                        <div className="flex gap-0.5">
                          {neuroPhases.map((letter, i) => (
                            <div
                              key={letter}
                              className={`flex-1 h-1.5 rounded-full ${i <= phaseIndex ? "bg-primary" : "bg-muted"}`}
                            />
                          ))}
                        </div>

                        {/* Budget */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{(p as any).service_type || "—"}</span>
                          <span className="font-semibold text-primary">£{(p.budget || 0).toLocaleString()}</span>
                        </div>

                        {p.budget ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Invoiced</span>
                              <span>£{(p.invoiced || 0).toLocaleString()} / £{(p.budget || 0).toLocaleString()}</span>
                            </div>
                            <Progress value={p.budget ? ((p.invoiced || 0) / p.budget) * 100 : 0} className="h-1" />
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Billing stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={`text-2xl font-bold ${outstandingTotal > 0 ? "text-amber-500" : ""}`}>
                    £{outstandingTotal.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className={`text-2xl font-bold ${overdueTotal > 0 ? "text-destructive" : ""}`}>
                    £{overdueTotal.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-[hsl(142,71%,45%)]">£{totalPaid.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Invoiced</p>
                  <p className="text-2xl font-bold">£{totalInvoiced.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Invoices list */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  All Invoices ({clientInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No invoices for this client.</p>
                ) : (
                  <div className="space-y-2">
                    {clientInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-md border">
                        <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString("en-GB") : "—"}
                            {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString("en-GB")}`}
                            {inv.projects?.name && ` · ${inv.projects.name}`}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">£{(inv.total || 0).toLocaleString()}</span>
                        <Badge variant="secondary" className="capitalize text-[9px]">{inv.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
