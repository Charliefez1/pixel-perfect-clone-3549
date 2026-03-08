import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDeal } from "@/hooks/useDeals";
import { useOrganisations } from "@/hooks/useOrganisations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDealDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [orgId, setOrgId] = useState("");
  const { data: orgs } = useOrganisations();
  const createDeal = useCreateDeal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createDeal.mutateAsync({
        title: title.trim(),
        value: value ? parseFloat(value) : 0,
        organisation_id: orgId || null,
      });
      toast.success("Deal created");
      setTitle(""); setValue(""); setOrgId("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create deal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Title</Label>
            <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NHS Neurodiversity Training" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-value">Value (£)</Label>
            <Input id="deal-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Organisation</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
