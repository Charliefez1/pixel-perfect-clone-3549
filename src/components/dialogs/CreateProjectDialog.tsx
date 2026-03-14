import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useProjects";
import { useOrganisations } from "@/hooks/useOrganisations";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const projectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or fewer"),
  organisation_id: z.string().optional(),
  budget: z.string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), { message: "Budget must be a positive number or 0" })
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  start_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid start date" }).optional().or(z.literal("")),
  end_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid end date" }).optional().or(z.literal("")),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, { message: "End date must be on or after start date", path: ["end_date"] });

type ProjectFormData = z.infer<typeof projectSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const { data: orgs } = useOrganisations();
  const createProject = useCreateProject();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", organisation_id: "", budget: "", description: "", start_date: "", end_date: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await createProject.mutateAsync({
        name: data.name.trim(),
        organisation_id: data.organisation_id || null,
        budget: data.budget ? parseFloat(data.budget) : 0,
        description: data.description || null,
      });
      toast.success("Project created");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" {...form.register("name")} placeholder="e.g. NHS Neuroinclusion Programme" autoFocus />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={form.watch("organisation_id") || ""} onValueChange={(v) => form.setValue("organisation_id", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-budget">Budget (GBP)</Label>
            <Input id="project-budget" type="number" {...form.register("budget")} placeholder="0" />
            {errors.budget && <p className="text-sm text-destructive">{errors.budget.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="project-start">Start Date</Label>
              <Input id="project-start" type="date" {...form.register("start_date")} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-end">End Date</Label>
              <Input id="project-end" type="date" {...form.register("end_date")} />
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea id="project-desc" {...form.register("description")} placeholder="Brief description..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending || !isValid}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
