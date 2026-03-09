import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContacts, Contact, useDeleteContact } from "@/hooks/useContacts";
import { useUpdateContact } from "@/hooks/useUpdateContact";
import { useDeals } from "@/hooks/useDeals";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { useDialogs } from "@/App";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";

export default function Contacts() {
  const { data: contacts, isLoading } = useContacts();
  const [selected, setSelected] = useState<Contact | null>(null);
  const { openCreateContact } = useDialogs();

  return (
    <>
      <PageHeader title="Contacts" searchPlaceholder="Search contacts..." actionLabel="New Contact" onAction={openCreateContact} />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !contacts?.length ? (
              <div className="p-12 text-center text-muted-foreground"><p>No contacts yet. Add your first contact to get started.</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{c.first_name[0]}{c.last_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{c.first_name} {c.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.email ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            {c.email}
                            <Mail className="h-3.5 w-3.5 text-primary/50 hover:text-primary cursor-pointer" />
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.job_title || "—"}</TableCell>
                      <TableCell className="text-sm">{c.organisations?.name || "—"}</TableCell>
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

      {selected && <ContactDetailPanel contact={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ContactDetailPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { data: deals } = useDeals();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editValues, setEditValues] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email || "",
    phone: contact.phone || "",
    job_title: contact.job_title || "",
    notes: contact.notes || "",
  });

  const linkedDeals = deals?.filter((d) => d.contact_id === contact.id) || [];

  const handleSave = () => {
    updateContact.mutate(
      { id: contact.id, ...editValues },
      { onSuccess: () => { toast.success("Contact updated"); setEditing(false); } }
    );
  };

  return (
    <DetailPanel
      open={!!contact}
      onOpenChange={onClose}
      title={`${contact.first_name} ${contact.last_name}`}
      fields={editing ? [] : [
        { label: "Email", value: contact.email },
        { label: "Phone", value: contact.phone },
        { label: "Job Title", value: contact.job_title },
        { label: "Organisation", value: contact.organisations?.name },
        { label: "Notes", value: contact.notes },
      ]}
    >
      {editing ? (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">First Name</label>
              <Input value={editValues.first_name} onChange={(e) => setEditValues({ ...editValues, first_name: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Last Name</label>
              <Input value={editValues.last_name} onChange={(e) => setEditValues({ ...editValues, last_name: e.target.value })} className="h-9" />
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
            <label className="text-xs text-muted-foreground">Job Title</label>
            <Input value={editValues.job_title} onChange={(e) => setEditValues({ ...editValues, job_title: e.target.value })} className="h-9" />
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
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Contact</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      )}

      <Tabs defaultValue="deals" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="deals" className="flex-1">Deals ({linkedDeals.length})</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="deals" className="pt-4">
          {!linkedDeals.length ? (
            <p className="text-sm text-muted-foreground">No deals linked to this contact.</p>
          ) : (
            <div className="space-y-2">
              {linkedDeals.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-md border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{d.stage} · {d.organisations?.name || "—"}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">£{(d.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <ActivityTimeline entityType="contact" entityId={contact.id} contactId={contact.id} organisationId={contact.organisation_id || undefined} />
        </TabsContent>
      </Tabs>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`${contact.first_name} ${contact.last_name}`}
        onConfirm={() => {
          deleteContact.mutate(contact.id, {
            onSuccess: () => { toast.success("Contact deleted"); onClose(); },
            onError: (e) => toast.error(e.message),
          });
        }}
        loading={deleteContact.isPending}
      />
    </DetailPanel>
  );
}
