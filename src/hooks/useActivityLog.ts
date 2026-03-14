import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";

export interface ActivityEntry {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  action: string;
  metadata: Record<string, any> | null;
  user_id: string | null;
  created_at: string;
}

export function useActivityLog(entityType?: string, entityId?: string) {
  return useQuery({
    queryKey: ["activity_log", entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (entityType) query = query.eq("entity_type", entityType);
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) { handleSupabaseError(error, "Loading activity log"); return []; }
      return data as ActivityEntry[];
    },
    enabled: true,
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      entity_type: string;
      entity_id?: string;
      entity_title?: string;
      action: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("activity_log").insert({
        ...entry,
        user_id: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
    },
    onError: (error) => handleSupabaseError(error as any, "Logging activity"),
  });
}
