import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectMilestone {
  id: string;
  project_id: string;
  milestone_key: string;
  label: string;
  sort_order: number;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export function useProjectMilestones(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_milestones", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ProjectMilestone[];
    },
    enabled: !!projectId,
  });
}

export function useToggleMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const updates = completed
        ? { completed_at: new Date().toISOString() }
        : { completed_at: null, completed_by: null };
      const { data, error } = await supabase
        .from("project_milestones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_milestones", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project_milestones"] });
    },
  });
}

/** Fetch milestones for ALL projects (used for board card summaries) */
export function useAllProjectMilestones() {
  return useQuery({
    queryKey: ["project_milestones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ProjectMilestone[];
    },
  });
}
