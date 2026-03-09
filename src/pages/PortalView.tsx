import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderOpen, FileText, MessageSquare, Receipt, LogOut, Send } from "lucide-react";

interface PortalOrg {
  id: string;
  name: string;
}

interface PortalProject {
  id: string;
  name: string;
  status: string;
  neuro_phase: string | null;
  budget: number | null;
  description: string | null;
}

interface PortalInvoice {
  id: string;
  invoice_number: string;
  status: string;
  total: number | null;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
}

export default function PortalView() {
  const { orgId } = useParams<{ orgId: string }>();
  const [org, setOrg] = useState<PortalOrg | null>(null);
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(null);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from("organisations").select("id, name").eq("id", orgId).single(),
      supabase.from("projects").select("id, name, status, neuro_phase, budget, description").eq("organisation_id", orgId).order("created_at", { ascending: false }),
      supabase.from("invoices").select("id, invoice_number, status, total, issue_date, due_date, paid_date").eq("organisation_id", orgId).order("created_at", { ascending: false }),
    ]).then(([orgRes, projRes, invRes]) => {
      if (orgRes.data) setOrg(orgRes.data);
      if (projRes.data) setProjects(projRes.data as PortalProject[]);
      if (invRes.data) setInvoices(invRes.data as PortalInvoice[]);
      setLoading(false);
    });
  }, [orgId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-4xl px-4 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto">N</div>
          <p className="text-lg font-medium">Portal not available</p>
          <p className="text-sm text-muted-foreground">This client portal is not currently active.</p>
        </div>
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    setup: "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-primary/20 text-primary",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              N
            </div>
            <div>
              <h1 className="text-lg font-bold">NDG Hub</h1>
              <p className="text-xs text-muted-foreground">{org.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome, {org.name}</h2>
          <p className="text-muted-foreground">
            Track the progress of your projects, access documents, and communicate with your delivery team.
          </p>
        </div>

        {!selectedProject ? (
          <>
            {/* Projects */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Projects</h3>
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>No projects found for your organisation.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((p) => (
                    <Card
                      key={p.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedProject(p)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{p.name}</p>
                          <Badge className={statusStyles[p.status] || "bg-muted"}>{p.status}</Badge>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FolderOpen className="h-3.5 w-3.5" />
                          <span>Click to view details</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Project detail view */}
            <div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)} className="mb-4">
                ← Back to projects
              </Button>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">{selectedProject.name}</h3>
                  <Badge className={statusStyles[selectedProject.status] || "bg-muted"}>{selectedProject.status}</Badge>
                </div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview" className="gap-2">
                    <FolderOpen className="h-3.5 w-3.5" /> Overview
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="gap-2">
                    <MessageSquare className="h-3.5 w-3.5" /> Messages
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="gap-2">
                    <Receipt className="h-3.5 w-3.5" /> Billing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 pt-4">
                  {selectedProject.description && (
                    <Card>
                      <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card>
                    <CardContent className="p-5 space-y-3">
                      <h4 className="font-medium text-sm">NEURO Phase</h4>
                      <div className="flex gap-1">
                        {["N", "E", "U", "R", "O"].map((letter, i) => {
                          const phaseToIndex: Record<string, number> = { needs: 0, engage: 1, understand: 2, redesign: 3, optimise: 4 };
                          const currentIndex = phaseToIndex[selectedProject.neuro_phase || "needs"] || 0;
                          return (
                            <div
                              key={letter}
                              className={`flex-1 h-8 rounded-md flex items-center justify-center text-xs font-semibold ${
                                i <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {letter}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5 space-y-2">
                      <h4 className="font-medium text-sm">Documents</h4>
                      <p className="text-sm text-muted-foreground">
                        Project documents will be accessible here once uploaded by the delivery team.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4 pt-4">
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      <div className="bg-primary/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary">NDG Team</span>
                          <span className="text-[10px] text-muted-foreground">Just now</span>
                        </div>
                        <p className="text-sm">Welcome to your project portal! We'll keep you updated on progress here.</p>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Input placeholder="Type a message..." className="flex-1" />
                        <Button size="sm"><Send className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 pt-4">
                  {(() => {
                    const outstanding = invoices.filter(i => i.status === "sent" || i.status === "viewed").reduce((s, i) => s + (i.total || 0), 0);
                    const overdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + (i.total || 0), 0);
                    const paid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0);
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-amber-600">£{outstanding.toLocaleString()}</p></CardContent></Card>
                        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-xl font-bold text-red-600">£{overdue.toLocaleString()}</p></CardContent></Card>
                        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold text-green-600">£{paid.toLocaleString()}</p></CardContent></Card>
                      </div>
                    );
                  })()}
                  {invoices.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p>No invoices yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right pr-6">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map(inv => (
                            <TableRow key={inv.id}>
                              <TableCell className="pl-6 font-medium">{inv.invoice_number}</TableCell>
                              <TableCell>
                                <Badge className={
                                  inv.status === "paid" ? "bg-green-100 text-green-700" :
                                  inv.status === "overdue" ? "bg-red-100 text-red-700" :
                                  inv.status === "sent" || inv.status === "viewed" ? "bg-amber-100 text-amber-700" :
                                  "bg-muted text-muted-foreground"
                                }>{inv.status}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{inv.issue_date || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{inv.due_date || "—"}</TableCell>
                              <TableCell className="text-right pr-6 font-medium">£{(inv.total || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        <div className="text-center text-xs text-muted-foreground pt-8 pb-4">
          Powered by NDG Hub
        </div>
      </div>
    </div>
  );
}
