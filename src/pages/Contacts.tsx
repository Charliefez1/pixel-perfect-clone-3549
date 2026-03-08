import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Building2, Mail, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const contacts = [
  { id: "1", name: "Sarah Mitchell", email: "sarah.m@nhs.uk", phone: "07700 900123", org: "NHS Yorkshire", role: "Head of L&D", sector: "Healthcare" },
  { id: "2", name: "James Porter", email: "j.porter@barclays.com", phone: "07700 900456", org: "Barclays", role: "HR Director", sector: "Finance" },
  { id: "3", name: "Emma Chen", email: "emma.chen@deloitte.co.uk", phone: "07700 900789", org: "Deloitte", role: "Wellbeing Lead", sector: "Professional Services" },
  { id: "4", name: "Tom Williams", email: "t.williams@az.com", phone: "07700 900321", org: "AstraZeneca", role: "People Partner", sector: "Pharma" },
  { id: "5", name: "Lucy Taylor", email: "lucy.t@unilever.com", phone: "07700 900654", org: "Unilever", role: "Talent Manager", sector: "FMCG" },
];

const organisations = [
  { id: "1", name: "NHS Yorkshire", sector: "Healthcare", contacts: 3, deals: 2, totalValue: 35000 },
  { id: "2", name: "Barclays", sector: "Finance", contacts: 2, deals: 1, totalValue: 45000 },
  { id: "3", name: "Deloitte", sector: "Professional Services", contacts: 4, deals: 3, totalValue: 68000 },
  { id: "4", name: "AstraZeneca", sector: "Pharma", contacts: 2, deals: 1, totalValue: 52000 },
  { id: "5", name: "Unilever", sector: "FMCG", contacts: 1, deals: 1, totalValue: 18500 },
];

export default function Contacts() {
  return (
    <>
      <TopBar title="Contacts" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts or organisations..." className="pl-9" />
          </div>
        </div>

        <Tabs defaultValue="contacts">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="organisations">Organisations</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {c.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {c.org}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.role}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.sector}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organisations" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Active Deals</TableHead>
                      <TableHead>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organisations.map((o) => (
                      <TableRow key={o.id} className="cursor-pointer">
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{o.sector}</Badge>
                        </TableCell>
                        <TableCell>{o.contacts}</TableCell>
                        <TableCell>{o.deals}</TableCell>
                        <TableCell className="font-semibold">£{o.totalValue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
