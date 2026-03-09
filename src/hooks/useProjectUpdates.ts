import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string | null;
  body: string;
  created_by: string | null;
  created_at: string;
}

export function useProjectUpdates(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_updates", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_updates" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProjectUpdate[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: { project_id: string; title?: string; body: string }) => {
      const { data, error } = await supabase
        .from("project_updates" as any)
        .insert(update)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProjectUpdate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_updates", data.project_id] });
    },
  });
}
