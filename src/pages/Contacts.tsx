import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContacts, Contact } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { useDialogs } from "@/App";

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
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !contacts?.length ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No contacts yet. Add your first contact to get started.</p>
              </div>
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
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {c.first_name[0]}{c.last_name[0]}
                            </AvatarFallback>
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
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.job_title || "—"}</TableCell>
                      <TableCell className="text-sm">{c.organisations?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell>
                        <button className="text-muted-foreground hover:text-foreground">⋯</button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={`${selected.first_name} ${selected.last_name}`}
          fields={[
            { label: "Email", value: selected.email },
            { label: "Phone", value: selected.phone },
            { label: "Job Title", value: selected.job_title },
            { label: "Organisation", value: selected.organisations?.name },
            { label: "Notes", value: selected.notes },
          ]}
        />
      )}
    </>
  );
}
