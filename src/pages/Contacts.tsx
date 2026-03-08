import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const contacts = [
  { id: "1", name: "Sarah Mitchell", email: "sarah.m@nhs.uk", phone: "07700 900123", org: "NHS Yorkshire", role: "Head of L&D", sector: "Healthcare" },
  { id: "2", name: "James Porter", email: "j.porter@barclays.com", phone: "07700 900456", org: "Barclays", role: "HR Director", sector: "Finance" },
  { id: "3", name: "Emma Chen", email: "emma.chen@deloitte.co.uk", phone: "07700 900789", org: "Deloitte", role: "Wellbeing Lead", sector: "Professional Services" },
  { id: "4", name: "Tom Williams", email: "t.williams@az.com", phone: "07700 900321", org: "AstraZeneca", role: "People Partner", sector: "Pharma" },
  { id: "5", name: "Lucy Taylor", email: "lucy.t@unilever.com", phone: "07700 900654", org: "Unilever", role: "Talent Manager", sector: "FMCG" },
];

export default function Contacts() {
  return (
    <>
      <PageHeader
        title="Contacts"
        searchPlaceholder="Search..."
        actionLabel="New Contact"
      />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name ↕</TableHead>
                  <TableHead>Email ↕</TableHead>
                  <TableHead>Job Title ↕</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone Number ↕</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {c.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {c.email}
                        <Mail className="h-3.5 w-3.5 text-primary/50 hover:text-primary cursor-pointer" />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.role}</TableCell>
                    <TableCell className="text-sm">{c.org}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.phone}</TableCell>
                    <TableCell>
                      <button className="text-muted-foreground hover:text-foreground">⋯</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
