import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const contacts = [
  { id: "1", name: "Lisa Morgan", email: "lisa.morgan@nhsbt.nhs.uk", phone: "07700 900123", org: "NHS Blood & Transplant", role: "Head of L&D", sector: "Healthcare" },
  { id: "2", name: "David Park", email: "d.park@ibm.com", phone: "07700 900456", org: "IBM", role: "VP People & Culture", sector: "Technology" },
  { id: "3", name: "Tom Harrison", email: "tom.harrison@lloydsbank.com", phone: "07700 900789", org: "Lloyds Bank", role: "HR Director", sector: "Financial Services" },
  { id: "4", name: "Anna Williams", email: "anna.w@google.com", phone: "07700 900321", org: "Google UK", role: "DEI Lead", sector: "Technology" },
  { id: "5", name: "Mark Davies", email: "mark.davies@tfl.gov.uk", phone: "07700 900654", org: "Transport for London", role: "People Partner", sector: "Public Sector" },
  { id: "6", name: "Rachel Green", email: "rachel.green@sky.uk", phone: "07700 900987", org: "Sky", role: "Talent Manager", sector: "Media" },
  { id: "7", name: "Emma Richards", email: "e.richards@paypal.com", phone: "07700 900111", org: "PayPal", role: "HR Business Partner", sector: "Technology" },
  { id: "8", name: "Sarah Thompson", email: "s.thompson@royalmail.com", phone: "07700 900222", org: "Royal Mail", role: "L&D Manager", sector: "Logistics" },
  { id: "9", name: "Dr James Liu", email: "jl789@cam.ac.uk", phone: "07700 900333", org: "University of Cambridge", role: "EDI Director", sector: "Education" },
  { id: "10", name: "Mike Chen", email: "mchen@elastic.co", phone: "07700 900444", org: "Elastic", role: "Chief People Officer", sector: "Technology" },
];

export default function Contacts() {
  return (
    <>
      <PageHeader
        title="Contacts"
        searchPlaceholder="Search contacts..."
        actionLabel="New Contact"
      />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name ↕</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Title ↕</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Phone</TableHead>
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
