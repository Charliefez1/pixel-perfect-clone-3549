import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganisations } from "@/hooks/useOrganisations";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <>
      <PageHeader title="Clients" searchPlaceholder="Search organisations..." actionLabel="New Client" />
      <div className="flex-1 overflow-auto">
        <Card className="border-0 rounded-none shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !clients?.length ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No clients yet. Add your first client to get started.</p>
              </div>
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
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{c.name}</span>
                            {c.website && (
                              <p className="text-xs text-muted-foreground">{c.website}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.sector && (
                          <Badge className={sectorColors[c.sector] || "bg-muted text-muted-foreground"}>
                            {c.sector}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
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
    </>
  );
}
