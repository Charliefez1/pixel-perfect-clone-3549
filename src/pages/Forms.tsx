import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForms, useCreateForm, useUpdateForm, useDeleteForm, Form } from "@/hooks/useForms";
import { defaultFormTemplates } from "@/lib/formTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { EmptyState } from "@/components/layout/EmptyState";
import { format } from "date-fns";
import { toast } from "sonner";
import { ClipboardList, FileText, MessageSquare, BarChart3, Sparkles, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const formTypes = [
  { value: "feedback", label: "Feedback", icon: MessageSquare },
  { value: "intake", label: "Intake Questionnaire", icon: ClipboardList },
  { value: "survey", label: "Post-Session Survey", icon: BarChart3 },
  { value: "assessment", label: "Assessment", icon: FileText },
];

const typeIcons: Record<string, typeof MessageSquare> = {
  feedback: MessageSquare,
  intake: ClipboardList,
  survey: BarChart3,
  assessment: FileText,
};

const templateOptions = [
  { key: "post_workshop", label: "Post-Workshop Feedback" },
  { key: "pre_session", label: "Pre-Session Survey" },
  { key: "follow_up_90", label: "90-Day Follow-Up" },
];

export default function Forms() {
  const { data: forms, isLoading } = useForms();
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const deleteForm = useDeleteForm();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState("feedback");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createForm.mutate(
      { title, type, description },
      {
        onSuccess: (data) => {
          toast.success("Form created");
          setDialogOpen(false);
          setTitle(""); setType("feedback"); setDescription("");
          navigate(`/forms/${data.id}/edit`);
        },
      }
    );
  };

  const handleCreateFromTemplate = (templateKey: string) => {
    const template = defaultFormTemplates[templateKey as keyof typeof defaultFormTemplates];
    if (!template) return;
    createForm.mutate(
      { title: template.title, type: template.type, description: template.description },
      {
        onSuccess: (data) => {
          updateForm.mutate(
            { id: data.id, fields_json: template.fields as any },
            {
              onSuccess: () => {
                toast.success(`Created "${template.title}" from template`);
                setTemplateDialogOpen(false);
                navigate(`/forms/${data.id}`);
              },
            }
          );
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteForm.mutate(deleteTarget.id, { onSuccess: () => { toast.success("Form deleted"); setDeleteTarget(null); } });
  };

  const filtered = forms?.filter(f =>
    !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.description?.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = filtered?.filter(f => f.active).length || 0;
  const totalResponses = filtered?.reduce((s, f) => s + (f.responses_count || 0), 0) || 0;

  return (
    <>
      <PageHeader title="Forms" searchPlaceholder="Search forms..." actionLabel="New Form" onAction={() => setDialogOpen(true)} onSearch={setSearch}>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => setTemplateDialogOpen(true)}>
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">From Template</span>
        </Button>
      </PageHeader>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Forms</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{filtered?.length || 0}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{activeCount}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Responses</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{totalResponses}</p>}</CardContent></Card>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : !filtered?.length ? (
          <EmptyState icon={ClipboardList} title="No forms found" description="Create your first form or start from a template.">
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Blank Form</Button>
              <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}><Sparkles className="h-4 w-4 mr-2" />From Template</Button>
            </div>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(f => {
              const Icon = typeIcons[f.type || "feedback"] || ClipboardList;
              const fieldCount = Array.isArray(f.fields_json) ? (f.fields_json as any[]).length : 0;
              return (
                <Card key={f.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(`/forms/${f.id}`)}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                      <div className="flex items-center gap-2">
                        {f.active ? <Badge className="bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => navigate(`/forms/${f.id}/edit`)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(f)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{f.title}</p>
                      {f.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{f.type}</Badge>
                        {fieldCount > 0 && <span>{fieldCount} fields</span>}
                      </div>
                      <span>{f.responses_count || 0} responses</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Form</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Form title" /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{formTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this form for?" /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createForm.isPending}>{createForm.isPending ? "Creating…" : "Create Form"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create from Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">Choose a pre-built form template to get started quickly.</p>
            {templateOptions.map(t => {
              const tmpl = defaultFormTemplates[t.key as keyof typeof defaultFormTemplates];
              return (
                <Card key={t.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateFromTemplate(t.key)}>
                  <CardContent className="p-4">
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tmpl.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{tmpl.fields.length} questions</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="form" onConfirm={handleDelete} loading={deleteForm.isPending} />
    </>
  );
}
