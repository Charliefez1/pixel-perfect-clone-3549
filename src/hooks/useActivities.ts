import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface Activity {
  id: string;
  organisation_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  type: string;
  subject: string | null;
  body: string | null;
  source: string | null;
  activity_date: string;
  created_at: string;
  created_by: string | null;
}

export function useActivities(entityType?: "organisation" | "contact" | "deal", entityId?: string) {
  return useQuery({
    queryKey: ["activities", entityType, entityId],
    queryFn: async () => {
      let query = supabase.from("activities").select("*").order("activity_date", { ascending: false });
      if (entityType === "organisation" && entityId) query = query.eq("organisation_id", entityId);
      else if (entityType === "contact" && entityId) query = query.eq("contact_id", entityId);
      else if (entityType === "deal" && entityId) query = query.eq("deal_id", entityId);
      const { data, error } = await query;
      if (error) { handleSupabaseError(error, "Loading activities"); return []; }
      return data as Activity[];
    },
    enabled: !!entityId,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Omit<Activity, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("activities")
        .insert(activity as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating activity"),
  });
}
