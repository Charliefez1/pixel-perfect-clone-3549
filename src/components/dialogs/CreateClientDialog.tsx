import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrganisation } from "@/hooks/useOrganisations";
import { toast } from "sonner";

const sectors = ["Healthcare", "Technology", "Financial Services", "Public Sector", "Media", "Education", "Legal", "Retail"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const createOrg = useCreateOrganisation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createOrg.mutateAsync({
        name: name.trim(),
        sector: sector || null,
        email: email || null,
        website: website || null,
      });
      toast.success("Client created");
      setName(""); setSector(""); setEmail(""); setWebsite("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Organisation Name</Label>
            <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lloyds Bank" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Sector</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue placeholder="Select sector…" /></SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input id="client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-website">Website</Label>
            <Input id="client-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createOrg.isPending || !name.trim()}>
              {createOrg.isPending ? "Creating…" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
