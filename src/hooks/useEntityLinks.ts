import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type EntityLink = Tables<"entity_links">;

export function useEntityLinks(sourceType: string, sourceId: string | undefined) {
  return useQuery({
    queryKey: ["entity_links", sourceType, sourceId],
    queryFn: async () => {
      if (!sourceId) return [];
      const { data, error } = await supabase
        .from("entity_links")
        .select("*")
        .or(`and(source_type.eq.${sourceType},source_id.eq.${sourceId}),and(target_type.eq.${sourceType},target_id.eq.${sourceId})`)
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading entity links"); return []; }
      return data as EntityLink[];
    },
    enabled: !!sourceId,
  });
}

export function useCreateEntityLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: TablesInsert<"entity_links">) => {
      const { data, error } = await supabase
        .from("entity_links")
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
      const { error } = await supabase.from("entity_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entity_links"] });
      toast.success("Link removed");
    },
    onError: (error) => handleSupabaseError(error as any, "Removing link"),
  });
}
