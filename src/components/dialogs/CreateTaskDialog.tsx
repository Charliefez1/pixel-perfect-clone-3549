import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type TaskPriority = Database["public"]["Enums"]["task_priority"];

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  priority: z.enum(["critical", "high", "medium", "low"], { required_error: "Priority is required" }),
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
  due_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date" }).optional().or(z.literal("")),
  project_id: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: Props) {
  const { data: projects } = useProjects();
  const createTask = useCreateTask();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      priority: "medium",
      status: undefined,
      due_date: "",
      project_id: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      await createTask.mutateAsync({
        title: data.title.trim(),
        priority: data.priority as TaskPriority,
        project_id: data.project_id || null,
      });
      toast.success("Task created");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create task");
    }
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" {...form.register("title")} placeholder="e.g. Prepare workshop slides" autoFocus />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as TaskFormData["priority"], { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={form.watch("project_id") || ""} onValueChange={(v) => form.setValue("project_id", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createTask.isPending || !isValid}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
