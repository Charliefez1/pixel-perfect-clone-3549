import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContacts, Contact, useDeleteContact } from "@/hooks/useContacts";
import { useUpdateContact } from "@/hooks/useUpdateContact";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { EmptyState } from "@/components/layout/EmptyState";
import { useDialogs } from "@/App";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { CSVImportDialog, CSVColumn } from "@/components/dialogs/CSVImportDialog";
import { Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const contactCSVColumns: CSVColumn[] = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "job_title", label: "Job Title" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "notes", label: "Notes" },
];

export default function Contacts() {
  const { data: contacts, isLoading, error, refetch } = useContacts();
  const [selected, setSelected] = useState<Contact | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const deleteContact = useDeleteContact();
  const { openCreateContact } = useDialogs();
  const queryClient = useQueryClient();

  const filtered = contacts?.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.organisations?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Contacts" searchPlaceholder="Search contacts..." actionLabel="New Contact" onAction={openCreateContact} onSearch={setSearch}>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>
      </PageHeader>
      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Contacts"
        tableName="contacts"
        columns={contactCSVColumns}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["contacts"] })}
      />
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-destructive">{error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </div>
        ) : (
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !filtered?.length ? (
              <EmptyState icon={Users} title="No contacts found" description={search ? "No contacts match your search." : "Add your first contact to get started."} action={!search ? { label: "New Contact", onClick: openCreateContact } : undefined} />
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
                  {filtered.map((c) => (
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="text-muted-foreground hover:text-foreground">⋯</button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setSelected(c)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelected(c)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {selected && <ContactDetailPanel contact={selected} onClose={() => setSelected(null)} />}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name}` : ""}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteContact.mutate(deleteTarget.id, {
            onSuccess: () => { toast.success("Contact deleted"); setDeleteTarget(null); },
            onError: (e) => toast.error(e.message),
          });
        }}
        loading={deleteContact.isPending}
      />
    </>
  );
}

function ContactDetailPanel({ contact, onClose }: { contact: Contact; onClose: () => void }) {
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
            <Button size="sm" onClick={handleSave} disabled={updateContact.isPending}>{updateContact.isPending ? "Saving..." : "Save"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Contact</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      )}

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>
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
