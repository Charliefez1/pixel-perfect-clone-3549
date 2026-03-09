import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type ProjectNote = Tables<"project_notes">;

export function useProjectNotes(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_notes", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectNote[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: TablesInsert<"project_notes">) => {
      const { data, error } = await supabase
        .from("project_notes")
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["project_notes", variables.project_id] });
    },
  });
}

export function useUpdateProjectNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("project_notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_notes"] });
    },
  });
}

export function useDeleteProjectNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_notes"] });
    },
  });
}
