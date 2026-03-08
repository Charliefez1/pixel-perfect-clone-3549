import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplates, Template } from "@/hooks/useDeliveries";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TaskItem {
  title: string;
  assignee: string;
  relative_due_days: number;
}

export default function Templates() {
  const { data: templates, isLoading } = useTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTasks, setEditTasks] = useState<TaskItem[]>([]);
  const queryClient = useQueryClient();

  const startEdit = (template: Template) => {
    setEditingId(template.id);
    setEditTasks(template.tasks_json || []);
  };

  const addTask = () => {
    setEditTasks([...editTasks, { title: "", assignee: "", relative_due_days: 7 }]);
  };

  const removeTask = (index: number) => {
    setEditTasks(editTasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof TaskItem, value: string | number) => {
    const updated = [...editTasks];
    (updated[index] as any)[field] = value;
    setEditTasks(updated);
  };

  const saveTemplate = async () => {
    if (!editingId) return;
    const validTasks = editTasks.filter((t) => t.title.trim());
    const tasksWithOrder = validTasks.map((t, i) => ({ ...t, sort_order: i }));
    const { error } = await supabase
      .from("templates")
      .update({ tasks_json: tasksWithOrder as any })
      .eq("id", editingId);
    if (error) {
      toast.error("Failed to save template");
      return;
    }
    toast.success("Template saved");
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    setEditingId(null);
  };

  return (
    <>
      <PageHeader title="Templates" searchPlaceholder="Search templates..." />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : !templates?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No templates found. Templates are seeded when the platform is set up.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className={editingId === template.id ? "ring-2 ring-primary" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.service_type && <Badge variant="secondary">{template.service_type}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editingId === template.id ? (
                    <>
                      <div className="space-y-2">
                        {editTasks.map((task, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Input
                              value={task.title}
                              onChange={(e) => updateTask(i, "title", e.target.value)}
                              placeholder="Task title"
                              className="flex-1 h-8 text-sm"
                            />
                            <Input
                              value={task.assignee}
                              onChange={(e) => updateTask(i, "assignee", e.target.value)}
                              placeholder="Assignee"
                              className="w-24 h-8 text-sm"
                            />
                            <Input
                              type="number"
                              value={task.relative_due_days}
                              onChange={(e) => updateTask(i, "relative_due_days", parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-sm"
                              title="Days from start"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeTask(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={addTask}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
                      </Button>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={saveTemplate}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        {(template.tasks_json || []).map((task, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground text-xs w-5">{i + 1}.</span>
                            <span className="flex-1">{task.title}</span>
                            {task.assignee && <span className="text-xs text-muted-foreground capitalize">{task.assignee}</span>}
                            <span className="text-xs text-muted-foreground">+{task.relative_due_days}d</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => startEdit(template)}>
                        Edit Tasks
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
