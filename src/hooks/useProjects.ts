import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Project = Tables<"projects"> & {
  organisations?: { name: string } | null;
};

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, organisations(name)")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading projects"); return []; }
      return data as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*, organisations(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) { handleSupabaseError(error, "Loading project"); return null; }
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: TablesInsert<"projects">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating project"),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"projects"> & { id: string }) => {
      const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating project"),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting project"),
  });
}
