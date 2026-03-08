import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForms, useCreateForm, useUpdateForm, Form } from "@/hooks/useForms";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { toast } from "sonner";
import { ClipboardList, FileText, MessageSquare, BarChart3 } from "lucide-react";

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

export default function Forms() {
  const { data: forms, isLoading } = useForms();
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Form | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("feedback");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    createForm.mutate(
      { title, type, description },
      { onSuccess: () => { toast.success("Form created"); setDialogOpen(false); setTitle(""); setType("feedback"); setDescription(""); } }
    );
  };

  const activeCount = forms?.filter(f => f.active).length || 0;
  const totalResponses = forms?.reduce((s, f) => s + (f.responses_count || 0), 0) || 0;

  return (
    <>
      <PageHeader title="Forms" searchPlaceholder="Search forms..." actionLabel="New Form" onAction={() => setDialogOpen(true)} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Forms</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{forms?.length || 0}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{activeCount}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Responses</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{totalResponses}</p>}</CardContent></Card>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : !forms?.length ? (
          <div className="p-12 text-center text-muted-foreground"><p>No forms yet. Create your first form to start collecting responses.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map(f => {
              const Icon = typeIcons[f.type || "feedback"] || ClipboardList;
              return (
                <Card key={f.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(f)}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 text-primary" /></div>
                      {f.active ? <Badge className="bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{f.title}</p>
                      {f.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{f.type}</Badge>
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
          <DialogFooter><Button onClick={handleCreate} disabled={createForm.isPending}>{createForm.isPending ? "Creating..." : "Create Form"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => setSelected(null)}
          title={selected.title}
          badge={{ label: selected.active ? "Active" : "Inactive", className: selected.active ? "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]" : "bg-muted text-muted-foreground" }}
          fields={[
            { label: "Type", value: selected.type },
            { label: "Description", value: selected.description },
            { label: "Responses", value: String(selected.responses_count || 0) },
            { label: "Created", value: format(new Date(selected.created_at), "dd/MM/yyyy") },
          ]}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Active</span>
            <Switch
              checked={selected.active ?? true}
              onCheckedChange={(checked) => {
                updateForm.mutate({ id: selected.id, active: checked }, { onSuccess: () => { toast.success(checked ? "Activated" : "Deactivated"); setSelected(null); } });
              }}
            />
          </div>
        </DetailPanel>
      )}
    </>
  );
}
