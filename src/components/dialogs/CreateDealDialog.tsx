import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDeal } from "@/hooks/useDeals";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const serviceTypes = [
  { value: "workshop", label: "Workshop" },
  { value: "programme", label: "Programme" },
  { value: "coaching", label: "Coaching" },
  { value: "keynote", label: "Keynote" },
  { value: "audit", label: "Audit" },
  { value: "sera_pilot", label: "SERA Pilot" },
];

export function CreateDealDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [probability, setProbability] = useState("50");
  const [orgId, setOrgId] = useState("");
  const [contactId, setContactId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [owner, setOwner] = useState("");
  const [expectedClose, setExpectedClose] = useState("");
  const [notes, setNotes] = useState("");
  const { data: orgs } = useOrganisations();
  const { data: contacts } = useContacts();
  const createDeal = useCreateDeal();

  const filteredContacts = orgId
    ? contacts?.filter((c) => c.organisation_id === orgId)
    : contacts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createDeal.mutateAsync({
        title: title.trim(),
        value: value ? parseFloat(value) : 0,
        probability: probability ? parseInt(probability) : 0,
        organisation_id: orgId || null,
        contact_id: contactId || null,
        expected_close_date: expectedClose || null,
        notes: notes || null,
      } as any);
      toast.success("Deal created");
      setTitle(""); setValue(""); setProbability("50"); setOrgId(""); setContactId(""); setServiceType(""); setOwner(""); setExpectedClose(""); setNotes("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create deal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Title</Label>
            <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SmartestEnergy L&D Programme" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-value">Value (£)</Label>
              <Input id="deal-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-prob">Probability (%)</Label>
              <Input id="deal-prob" type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Organisation</Label>
            <Select value={orgId} onValueChange={(v) => { setOrgId(v); setContactId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger><SelectValue placeholder="Select contact…" /></SelectTrigger>
              <SelectContent>
                {filteredContacts?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger><SelectValue placeholder="Select owner…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="charlie">Charlie</SelectItem>
                  <SelectItem value="rich">Rich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-close">Expected Close Date</Label>
            <Input id="deal-close" type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notes</Label>
            <Textarea id="deal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Deal notes…" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createDeal.isPending || !title.trim()}>
              {createDeal.isPending ? "Creating…" : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
