import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useProjects";
import { useOrganisations } from "@/hooks/useOrganisations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const { data: orgs } = useOrganisations();
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        organisation_id: orgId || null,
        budget: budget ? parseFloat(budget) : 0,
        description: description || null,
      });
      toast.success("Project created");
      setName(""); setOrgId(""); setBudget(""); setDescription("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NHS Neuroinclusion Programme" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-budget">Budget (£)</Label>
            <Input id="project-budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea id="project-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending || !name.trim()}>
              {createProject.isPending ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
