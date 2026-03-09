import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganisations, Organisation, useDeleteOrganisation } from "@/hooks/useOrganisations";
import { useUpdateOrganisation } from "@/hooks/useUpdateOrganisation";
import { useContacts } from "@/hooks/useContacts";
import { useDeals } from "@/hooks/useDeals";
import { useInvoices } from "@/hooks/useInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { useDialogs } from "@/App";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { format } from "date-fns";
import { toast } from "sonner";

const sectorColors: Record<string, string> = {
  Healthcare: "bg-[hsl(var(--stage-lead))]/20 text-[hsl(var(--stage-lead))]",
  Technology: "bg-[hsl(var(--stage-qualified))]/20 text-[hsl(var(--stage-qualified))]",
  "Financial Services": "bg-[hsl(var(--stage-proposal))]/20 text-[hsl(var(--stage-proposal))]",
  "Public Sector": "bg-[hsl(var(--stage-negotiation))]/20 text-[hsl(var(--stage-negotiation))]",
  Media: "bg-[hsl(var(--stage-verbal))]/20 text-[hsl(var(--stage-verbal))]",
  Education: "bg-primary/20 text-primary",
};

export default function Clients() {
  const { data: clients, isLoading } = useOrganisations();
  const [selected, setSelected] = useState<Organisation | null>(null);
  const { openCreateClient } = useDialogs();

  return (
    <>
      <PageHeader title="Clients" searchPlaceholder="Search organisations..." actionLabel="New Client" onAction={openCreateClient} />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !clients?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No clients yet. Add your first client to get started.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Organisation</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{c.name}</span>
                            {c.website && <p className="text-xs text-muted-foreground">{c.website}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{c.sector && <Badge className={sectorColors[c.sector] || "bg-muted text-muted-foreground"}>{c.sector}</Badge>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell><button className="text-muted-foreground hover:text-foreground">⋯</button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && <ClientDetailPanel client={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ClientDetailPanel({ client, onClose }: { client: Organisation; onClose: () => void }) {
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const { data: invoices } = useInvoices();
  const updateOrg = useUpdateOrganisation();
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    sector: client.sector || "",
    website: client.website || "",
    notes: client.notes || "",
  });

  const linkedContacts = contacts?.filter((c) => c.organisation_id === client.id) || [];
  const linkedDeals = deals?.filter((d) => d.organisation_id === client.id) || [];
  const linkedInvoices = invoices?.filter((i) => i.organisation_id === client.id) || [];
  const totalDealValue = linkedDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const handleSave = () => {
    updateOrg.mutate(
      { id: client.id, ...editValues },
      {
        onSuccess: () => { toast.success("Client updated"); setEditing(false); },
      }
    );
  };

  return (
    <DetailPanel
      open={!!client}
      onOpenChange={onClose}
      title={client.name}
      badge={client.sector ? { label: client.sector } : undefined}
      fields={editing ? [] : [
        { label: "Email", value: client.email },
        { label: "Phone", value: client.phone },
        { label: "Website", value: client.website },
        { label: "Address", value: client.address },
        { label: "Sector", value: client.sector },
        { label: "Total Deals", value: `${linkedDeals.length} (£${totalDealValue.toLocaleString()})` },
        { label: "Notes", value: client.notes },
      ]}
    >
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Sector</label>
              <Input value={editValues.sector} onChange={(e) => setEditValues({ ...editValues, sector: e.target.value })} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={editValues.email} onChange={(e) => setEditValues({ ...editValues, email: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={editValues.phone} onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })} className="h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Website</label>
            <Input value={editValues.website} onChange={(e) => setEditValues({ ...editValues, website: e.target.value })} className="h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notes</label>
            <Textarea value={editValues.notes} onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setEditing(true)}>Edit Client</Button>
      )}

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="contacts" className="flex-1">Contacts ({linkedContacts.length})</TabsTrigger>
          <TabsTrigger value="deals" className="flex-1">Deals ({linkedDeals.length})</TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1">Invoices ({linkedInvoices.length})</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="pt-4">
          {!linkedContacts.length ? (
            <p className="text-sm text-muted-foreground">No contacts linked to this client.</p>
          ) : (
            <div className="space-y-2">
              {linkedContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground">{c.job_title || c.email || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="deals" className="pt-4">
          {!linkedDeals.length ? (
            <p className="text-sm text-muted-foreground">No deals linked to this client.</p>
          ) : (
            <div className="space-y-2">
              {linkedDeals.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{d.stage}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">£{(d.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="invoices" className="pt-4">
          {!linkedInvoices.length ? (
            <p className="text-sm text-muted-foreground">No invoices linked to this client.</p>
          ) : (
            <div className="space-y-2">
              {linkedInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.issue_date ? format(new Date(inv.issue_date), "dd/MM/yyyy") : "—"}</p>
                  </div>
                  <span className="text-sm font-semibold">£{(inv.total || 0).toLocaleString()}</span>
                  <Badge variant="secondary">{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <ActivityTimeline entityType="organisation" entityId={client.id} organisationId={client.id} />
        </TabsContent>
      </Tabs>
    </DetailPanel>
  );
}
