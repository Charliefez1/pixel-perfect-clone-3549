import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServices, useCreateService, useUpdateService, useDeleteService, Service } from "@/hooks/useServices";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Layers, Pencil, Trash2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";

const categories = ["Workshop", "Programme", "Coaching", "Keynote", "Audit", "SERA Pilot", "Consultancy"];

export default function Services() {
  const { data: services, isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const startEdit = () => {
    if (!selected) return;
    setEditName(selected.name);
    setEditCategory(selected.category || "");
    setEditDescription(selected.description || "");
    setEditDuration(String(selected.default_duration_days || 1));
    setEditPrice(String(selected.default_price || 0));
    setEditing(true);
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    createService.mutate(
      { name, category: category || undefined, description, default_duration_days: parseInt(duration) || 1, default_price: parseFloat(price) || 0 },
      { onSuccess: () => { toast.success("Service created"); setDialogOpen(false); setName(""); setCategory(""); setDescription(""); setDuration(""); setPrice(""); } }
    );
  };

  const handleSaveEdit = () => {
    if (!selected || !editName.trim()) return;
    updateService.mutate(
      { id: selected.id, name: editName, category: editCategory || null, description: editDescription || null, default_duration_days: parseInt(editDuration) || 1, default_price: parseFloat(editPrice) || 0 },
      { onSuccess: (data) => { toast.success("Service updated"); setEditing(false); setSelected(data as Service); } }
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteService.mutate(selected.id, { onSuccess: () => { toast.success("Service deleted"); setDeleteOpen(false); setSelected(null); } });
  };

  const filtered = services?.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = filtered?.filter(s => s.active).length || 0;

  return (
    <>
      <PageHeader title="Services" searchPlaceholder="Search services..." actionLabel="New Service" onAction={() => setDialogOpen(true)} onSearch={setSearch} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Services</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{filtered?.length || 0}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{activeCount}</p>}</CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Categories</p>{isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold">{new Set(filtered?.map(s => s.category).filter(Boolean)).size}</p>}</CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !filtered?.length ? (
              <EmptyState icon={Layers} title="No services found" description="Add your first service to the catalogue." action={{ label: "New Service", onClick: () => setDialogOpen(true) }} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => { setSelected(s); setEditing(false); }}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center"><Layers className="h-4 w-4 text-primary" /></div>
                          <div><span className="font-medium text-sm">{s.name}</span>{s.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{s.description}</p>}</div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{s.category || "—"}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.default_duration_days || 1} day{(s.default_duration_days || 1) !== 1 ? "s" : ""}</TableCell>
                      <TableCell className="text-sm">£{(s.default_price || 0).toLocaleString()}</TableCell>
                      <TableCell>{s.active ? <Badge className="bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Service</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Service name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Default Duration (days)</Label><Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="1" /></div>
            </div>
            <div className="space-y-2"><Label>Default Price (£)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={createService.isPending}>{createService.isPending ? "Creating…" : "Create Service"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && (
        <DetailPanel
          open={!!selected}
          onOpenChange={() => { setSelected(null); setEditing(false); }}
          title={editing ? editName : selected.name}
          badge={{ label: selected.active ? "Active" : "Inactive", className: selected.active ? "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]" : "bg-muted text-muted-foreground" }}
          fields={editing ? [] : [
            { label: "Category", value: selected.category },
            { label: "Duration", value: `${selected.default_duration_days || 1} day(s)` },
            { label: "Price", value: `£${(selected.default_price || 0).toLocaleString()}` },
            { label: "Description", value: selected.description },
          ]}
        >
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Category</Label><Select value={editCategory} onValueChange={setEditCategory}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Duration (days)</Label><Input type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} /></div>
                <div className="space-y-2"><Label>Price (£)</Label><Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateService.isPending}>{updateService.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Active</span>
                <Switch
                  checked={selected.active ?? true}
                  onCheckedChange={(checked) => {
                    updateService.mutate({ id: selected.id, active: checked }, { onSuccess: (data) => { toast.success(checked ? "Activated" : "Deactivated"); setSelected(data as Service); } });
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={startEdit}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
              </div>
            </div>
          )}
        </DetailPanel>
      )}

      <DeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="service" onConfirm={handleDelete} loading={deleteService.isPending} />
    </>
  );
}
