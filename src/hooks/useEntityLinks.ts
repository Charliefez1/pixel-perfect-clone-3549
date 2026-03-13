import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface EntityLink {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship: string | null;
  created_at: string;
}

export function useEntityLinks(sourceType: string, sourceId: string | undefined) {
  return useQuery({
    queryKey: ["entity_links", sourceType, sourceId],
    queryFn: async () => {
      if (!sourceId) return [];
      const { data, error } = await supabase
        .from("entity_links" as any)
        .select("*")
        .or(`and(source_type.eq.${sourceType},source_id.eq.${sourceId}),and(target_type.eq.${sourceType},target_id.eq.${sourceId})`)
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading entity links"); return []; }
      return data as unknown as EntityLink[];
    },
    enabled: !!sourceId,
  });
}

export function useCreateEntityLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: Omit<EntityLink, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("entity_links" as any)
        .insert(link)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entity_links"] });
      toast.success("Link created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating link"),
  });
}

export function useDeleteEntityLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_links" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entity_links"] });
      toast.success("Link removed");
    },
    onError: (error) => handleSupabaseError(error as any, "Removing link"),
  });
}
