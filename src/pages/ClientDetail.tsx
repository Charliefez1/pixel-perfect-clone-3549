import { useParams, useNavigate } from "react-router-dom";
import { useOrganisation } from "@/hooks/useOrganisations";
import { useProjects } from "@/hooks/useProjects";
import { useContacts } from "@/hooks/useContacts";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useDialogs } from "@/App";
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
const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, realise: 3, ongoing: 4 };
const statusStyles: Record<string, string> = {
  setup: "bg-muted text-muted-foreground",
  active: "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]",
  paused: "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  completed: "bg-primary/20 text-primary",
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading } = useOrganisation(id);
  const { data: allProjects } = useProjects();
  const { data: allContacts } = useContacts();
  const { data: allInvoices } = useInvoices();
  const { openCreateProject } = useDialogs();

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
  const outstandingInvoices = clientInvoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  const outstandingTotal = outstandingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

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
                <h1 className="text-xl font-bold">{client.name}</h1>
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

      <div className="p-6 space-y-6">
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

        {/* Key Contacts */}
        {clientContacts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Key Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {clientContacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-md border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                      {c.first_name?.[0]}{c.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.job_title || c.email || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Projects */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                All Projects ({clientProjects.length})
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
                          <Badge className={statusStyles[p.status]}>{p.status}</Badge>
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
                          <span className="text-muted-foreground capitalize">{p.service_type || "—"}</span>
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
          </CardContent>
        </Card>

        {/* Active Invoices */}
        {clientInvoices.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Invoices ({clientInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-md border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString("en-GB") : "—"}
                        {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">£{(inv.total || 0).toLocaleString()}</span>
                    <Badge variant="secondary" className="capitalize">{inv.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
