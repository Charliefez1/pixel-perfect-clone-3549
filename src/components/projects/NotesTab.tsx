import { useState } from "react";
import { useProjectNotes, useCreateProjectNote, useUpdateProjectNote, useDeleteProjectNote, ProjectNote } from "@/hooks/useProjectNotes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StickyNote, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface NotesTabProps {
  projectId: string;
}

export function NotesTab({ projectId }: NotesTabProps) {
  const { data: notes, isLoading } = useProjectNotes(projectId);
  const createNote = useCreateProjectNote();
  const updateNote = useUpdateProjectNote();
  const deleteNote = useDeleteProjectNote();

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const handleCreate = () => {
    if (!newBody.trim()) {
      toast.error("Note body is required");
      return;
    }
    createNote.mutate(
      { project_id: projectId, title: newTitle || null, body: newBody },
      {
        onSuccess: () => {
          toast.success("Note added");
          setCreating(false);
          setNewTitle("");
          setNewBody("");
        },
      }
    );
  };

  const startEditing = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditTitle(note.title || "");
    setEditBody(note.body);
  };

  const handleUpdate = () => {
    if (!editingId || !editBody.trim()) return;
    updateNote.mutate(
      { id: editingId, title: editTitle || null, body: editBody },
      {
        onSuccess: () => {
          toast.success("Note updated");
          setEditingId(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteNote.mutate(id, {
      onSuccess: () => toast.success("Note deleted"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes?.length || 0} note{(notes?.length || 0) !== 1 ? "s" : ""}
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {creating && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Note title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-9"
            />
            <Textarea
              placeholder="Write your note..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createNote.isPending || !newBody.trim()}
              >
                {createNote.isPending ? "Saving..." : "Save Note"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCreating(false);
                  setNewTitle("");
                  setNewBody("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!notes?.length && !creating ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <StickyNote className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No notes yet.</p>
            <p className="text-xs mt-1">Add notes to capture important details about this project.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes?.map((note) =>
            editingId === note.id ? (
              <Card key={note.id}>
                <CardContent className="p-4 space-y-3">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="h-9"
                  />
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate} disabled={updateNote.isPending}>
                      {updateNote.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={note.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {note.title && (
                        <p className="font-medium text-sm mb-1">{note.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {note.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {format(new Date(note.created_at), "dd MMM yyyy, HH:mm")}
                        {note.updated_at !== note.created_at && " (edited)"}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEditing(note)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
