import { useState, useEffect } from "react";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const deliverySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or fewer"),
  project_id: z.string().optional(),
  delivery_date: z.string().min(1, "Delivery date is required").refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  delegate_count: z.string()
    .refine((val) => {
      if (!val) return true;
      const n = Number(val);
      return Number.isInteger(n) && n >= 0;
    }, { message: "Delegate count must be a non-negative integer" })
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeliveryDialog({ open, onOpenChange }: Props) {
  const { data: projects } = useProjects();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: { title: "", project_id: "", delivery_date: "", delegate_count: "", notes: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = async (data: DeliveryFormData) => {
    setLoading(true);
    const project = projects?.find(p => p.id === data.project_id);
    const { error } = await supabase.from("deliveries").insert({
      title: data.title,
      project_id: data.project_id || null,
      organisation_id: project?.organisation_id || null,
      delivery_date: data.delivery_date || null,
      notes: data.notes || null,
      status: "planning",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Delivery created");
    queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    onOpenChange(false);
    form.reset();
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Delivery</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("title")} placeholder="Delivery title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={form.watch("project_id") || ""} onValueChange={(v) => form.setValue("project_id", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Input type="date" {...form.register("delivery_date")} />
            {errors.delivery_date && <p className="text-sm text-destructive">{errors.delivery_date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Delegate Count</Label>
            <Input type="number" {...form.register("delegate_count")} placeholder="0" />
            {errors.delegate_count && <p className="text-sm text-destructive">{errors.delegate_count.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !isValid}>{loading ? "Creating..." : "Create Delivery"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
