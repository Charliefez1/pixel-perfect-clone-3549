import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplates, Template } from "@/hooks/useDeliveries";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, GripVertical, FileText, FileSignature, ShoppingCart, Layers, Copy, Variable } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TaskItem {
  title: string;
  assignee: string;
  relative_due_days: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  content: string | null;
  variables: any;
  service_type: string | null;
  created_at: string;
}

const mergeFieldsByType: Record<string, string[]> = {
  proposal: [
    "{{client_name}}", "{{client_address}}", "{{project_name}}", "{{service_type}}",
    "{{description}}", "{{budget}}", "{{start_date}}", "{{end_date}}",
    "{{deliverables_list}}", "{{payment_terms}}", "{{consultant_name}}", "{{date}}",
  ],
  contract: [
    "{{client_name}}", "{{client_address}}", "{{client_contact}}", "{{project_name}}",
    "{{scope_of_work}}", "{{budget}}", "{{payment_schedule}}", "{{start_date}}",
    "{{end_date}}", "{{termination_terms}}", "{{confidentiality_clause}}", "{{date}}",
  ],
  purchase_order: [
    "{{po_number}}", "{{client_name}}", "{{project_name}}", "{{line_items_table}}",
    "{{subtotal}}", "{{vat}}", "{{total}}", "{{delivery_date}}",
    "{{payment_terms}}", "{{billing_address}}",
  ],
};

const defaultProposalContent = `# Proposal: {{project_name}}

**Prepared for:** {{client_name}}
**Date:** {{date}}
**Prepared by:** {{consultant_name}}

---

## Executive Summary

{{description}}

## Service Type

{{service_type}}

## Deliverables

{{deliverables_list}}

## Timeline

- **Start Date:** {{start_date}}
- **End Date:** {{end_date}}

## Investment

**Total Budget:** £{{budget}}

**Payment Terms:** {{payment_terms}}

---

*This proposal is valid for 30 days from the date above.*
`;

const defaultContractContent = `# Service Agreement

**Between:** Neurodiversity Global Ltd ("NDG")
**And:** {{client_name}} ("Client")
**Date:** {{date}}

---

## 1. Scope of Work

{{scope_of_work}}

## 2. Project Details

- **Project:** {{project_name}}
- **Start Date:** {{start_date}}
- **End Date:** {{end_date}}

## 3. Fees & Payment

**Total Fee:** £{{budget}}

**Payment Schedule:** {{payment_schedule}}

## 4. Termination

{{termination_terms}}

## 5. Confidentiality

{{confidentiality_clause}}

---

**Signed on behalf of NDG:**

Name: ____________________  Date: ____________

**Signed on behalf of {{client_name}}:**

Name: ____________________  Date: ____________
`;

const defaultPOContent = `# Purchase Order

**PO Number:** {{po_number}}
**Date:** {{date}}

---

**Bill To:**
{{billing_address}}

**Project:** {{project_name}}
**Client:** {{client_name}}

## Line Items

{{line_items_table}}

---

| | |
|---|---|
| **Subtotal** | £{{subtotal}} |
| **VAT (20%)** | £{{vat}} |
| **Total** | £{{total}} |

**Delivery Date:** {{delivery_date}}
**Payment Terms:** {{payment_terms}}
`;

function useDocumentTemplates() {
  return useQuery({
    queryKey: ["document_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as unknown as DocumentTemplate[];
    },
  });
}

export default function Templates() {
  const { data: templates, isLoading } = useDocumentTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTasks, setEditTasks] = useState<TaskItem[]>([]);
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState<string>("project");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("project");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allTemplates = templates?.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())) || [];
  const projectTemplates = allTemplates.filter(t => !(t as any).template_type || (t as any).template_type === "project");
  const proposalTemplates = allTemplates.filter(t => (t as any).template_type === "proposal");
  const contractTemplates = allTemplates.filter(t => (t as any).template_type === "contract");
  const poTemplates = allTemplates.filter(t => (t as any).template_type === "purchase_order");

  const startEditProject = (template: any) => {
    setEditingId(template.id);
    setEditType("project");
    setEditTasks(template.tasks_json || []);
  };

  const startEditDocument = (template: DocumentTemplate) => {
    setEditingId(template.id);
    setEditType(template.template_type || "proposal");
    setEditContent(template.content || getDefaultContent(template.template_type || "proposal"));
  };

  const getDefaultContent = (type: string) => {
    if (type === "proposal") return defaultProposalContent;
    if (type === "contract") return defaultContractContent;
    if (type === "purchase_order") return defaultPOContent;
    return "";
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

  const saveProjectTemplate = async () => {
    if (!editingId) return;
    const validTasks = editTasks.filter((t) => t.title.trim());
    const tasksWithOrder = validTasks.map((t, i) => ({ ...t, sort_order: i }));
    const { error } = await supabase
      .from("templates")
      .update({ tasks_json: tasksWithOrder as any })
      .eq("id", editingId);
    if (error) { toast.error("Failed to save template"); return; }
    toast.success("Template saved");
    queryClient.invalidateQueries({ queryKey: ["document_templates"] });
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    setEditingId(null);
  };

  const saveDocumentTemplate = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("templates")
      .update({ content: editContent } as any)
      .eq("id", editingId);
    if (error) { toast.error("Failed to save template"); return; }
    toast.success("Template saved");
    queryClient.invalidateQueries({ queryKey: ["document_templates"] });
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    const insertData: any = {
      name: newName,
      template_type: newType,
    };
    if (newType !== "project") {
      insertData.content = getDefaultContent(newType);
      insertData.variables = mergeFieldsByType[newType] || [];
    }
    const { error } = await supabase.from("templates").insert(insertData);
    if (error) { toast.error("Failed to create template"); return; }
    toast.success("Template created");
    queryClient.invalidateQueries({ queryKey: ["document_templates"] });
    queryClient.invalidateQueries({ queryKey: ["templates"] });
    setCreateOpen(false);
    setNewName("");
    setNewType("project");
  };

  const insertMergeField = (field: string) => {
    setEditContent(prev => prev + field);
    toast.success(`Inserted ${field}`);
  };

  return (
    <>
      <PageHeader title="Templates" searchPlaceholder="Search templates..." actionLabel="New Template" onAction={() => setCreateOpen(true)} onSearch={setSearch} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Tabs defaultValue="project">
          <TabsList>
            <TabsTrigger value="project">
              Project Templates ({projectTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="proposal">
              Proposal Templates ({proposalTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="contract">
              Contract Templates ({contractTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="purchase_order">
              PO Templates ({poTemplates.length})
            </TabsTrigger>
          </TabsList>

          {/* Project Templates */}
          <TabsContent value="project" className="space-y-4 pt-4">
            {isLoading ? (
              <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : !projectTemplates.length ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No project templates. Create one to define reusable task lists.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projectTemplates.map((template) => (
                  <Card key={template.id} className={editingId === template.id && editType === "project" ? "ring-2 ring-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.service_type && <Badge variant="secondary">{template.service_type}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {editingId === template.id && editType === "project" ? (
                        <>
                          <div className="space-y-2">
                            {editTasks.map((task, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                <Input value={task.title} onChange={(e) => updateTask(i, "title", e.target.value)} placeholder="Task title" className="flex-1 h-8 text-sm" />
                                <Input value={task.assignee} onChange={(e) => updateTask(i, "assignee", e.target.value)} placeholder="Assignee" className="w-24 h-8 text-sm" />
                                <Input type="number" value={task.relative_due_days} onChange={(e) => updateTask(i, "relative_due_days", parseInt(e.target.value) || 0)} className="w-16 h-8 text-sm" title="Days from start" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeTask(i)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button variant="outline" size="sm" onClick={addTask}><Plus className="h-3.5 w-3.5 mr-1" /> Add Task</Button>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={saveProjectTemplate}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            {((template as any).tasks_json || []).map((task: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground text-xs w-5">{i + 1}.</span>
                                <span className="flex-1">{task.title}</span>
                                {task.assignee && <span className="text-xs text-muted-foreground capitalize">{task.assignee}</span>}
                                <span className="text-xs text-muted-foreground">+{task.relative_due_days}d</span>
                              </div>
                            ))}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => startEditProject(template)}>Edit Tasks</Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Document Templates (proposal, contract, PO) */}
          {(["proposal", "contract", "purchase_order"] as const).map((templateType) => {
            const list = templateType === "proposal" ? proposalTemplates : templateType === "contract" ? contractTemplates : poTemplates;
            const icon = templateType === "proposal" ? FileText : templateType === "contract" ? FileSignature : ShoppingCart;
            const Icon = icon;

            return (
              <TabsContent key={templateType} value={templateType} className="space-y-4 pt-4">
                {isLoading ? (
                  <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
                ) : !list.length ? (
                  <div className="p-12 text-center text-muted-foreground space-y-3">
                    <Icon className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p>No {templateType.replace("_", " ")} templates yet.</p>
                    <Button variant="outline" onClick={() => { setNewType(templateType); setCreateOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create {templateType.replace("_", " ")} template
                    </Button>
                  </div>
                ) : editingId && editType === templateType ? (
                  /* Document Editor */
                  <div className="grid grid-cols-[1fr_250px] gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Template Editor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[500px] font-mono text-sm"
                          placeholder="Write your template content in Markdown..."
                        />
                        <div className="flex gap-2 pt-4">
                          <Button size="sm" onClick={saveDocumentTemplate}>Save Template</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Variable className="h-4 w-4" />
                          <CardTitle className="text-sm">Merge Fields</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-3">Click to insert a merge field at the cursor position.</p>
                        <div className="space-y-1">
                          {(mergeFieldsByType[templateType] || []).map(field => (
                            <button
                              key={field}
                              onClick={() => insertMergeField(field)}
                              className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors font-mono"
                            >
                              {field}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {list.map(template => (
                      <Card key={template.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-base">{template.name}</CardTitle>
                            </div>
                            <Badge variant="secondary" className="capitalize">{templateType.replace("_", " ")}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {template.content ? (
                            <pre className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md max-h-32 overflow-hidden line-clamp-6 whitespace-pre-wrap">
                              {template.content.slice(0, 300)}...
                            </pre>
                          ) : (
                            <p className="text-xs text-muted-foreground">No content yet</p>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEditDocument(template as any)}>
                              Edit Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Template name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project Template</SelectItem>
                  <SelectItem value="proposal">Proposal Template</SelectItem>
                  <SelectItem value="contract">Contract Template</SelectItem>
                  <SelectItem value="purchase_order">Purchase Order Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
