import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeliveryDialog({ open, onOpenChange }: Props) {
  const { data: projects } = useProjects();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    const project = projects?.find(p => p.id === projectId);
    const { error } = await supabase.from("deliveries").insert({
      title,
      project_id: projectId || null,
      organisation_id: project?.organisation_id || null,
      delivery_date: deliveryDate || null,
      notes: notes || null,
      status: "planning",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Delivery created");
    queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    onOpenChange(false);
    setTitle(""); setProjectId(""); setDeliveryDate(""); setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Delivery</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Delivery title" />
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading}>{loading ? "Creating..." : "Create Delivery"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
