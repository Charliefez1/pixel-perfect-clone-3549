import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContact } from "@/hooks/useContacts";
import { useOrganisations } from "@/hooks/useOrganisations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ open, onOpenChange }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const { data: orgs } = useOrganisations();
  const createContact = useCreateContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    try {
      await createContact.mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email || null,
        job_title: jobTitle || null,
        organisation_id: orgId || null,
      });
      toast.success("Contact created");
      setFirstName(""); setLastName(""); setEmail(""); setJobTitle(""); setOrgId("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create contact");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact-first">First Name</Label>
              <Input id="contact-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-last">Last Name</Label>
              <Input id="contact-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-job">Job Title</Label>
            <Input id="contact-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Head of D&I" />
          </div>
          <div className="space-y-2">
            <Label>Organisation</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Select organisation…" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createContact.isPending || !firstName.trim() || !lastName.trim()}>
              {createContact.isPending ? "Creating…" : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
