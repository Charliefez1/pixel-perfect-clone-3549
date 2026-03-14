import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface ProjectNote {
  id: string;
  project_id: string;
  title: string;
  body: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectNotes(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_notes", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_notes" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading notes"); return []; }
      return data as unknown as ProjectNote[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { project_id: string; title: string; body: string }) => {
      const { data, error } = await supabase
        .from("project_notes" as any)
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProjectNote;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project_notes", data.project_id] });
      toast.success("Note created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating note"),
  });
}

export function useUpdateProjectNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("project_notes" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["project_notes", data?.project_id] });
      qc.invalidateQueries({ queryKey: ["project_notes"] });
      toast.success("Note updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating note"),
  });
}

export function useDeleteProjectNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId?: string }) => {
      const { error } = await supabase.from("project_notes" as any).delete().eq("id", id);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      if (data?.projectId) qc.invalidateQueries({ queryKey: ["project_notes", data.projectId] });
      qc.invalidateQueries({ queryKey: ["project_notes"] });
      toast.success("Note deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting note"),
  });
}
