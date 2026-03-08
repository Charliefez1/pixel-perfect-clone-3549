import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Organisation = Tables<"organisations">;

export function useOrganisations() {
  return useQuery({
    queryKey: ["organisations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Organisation[];
    },
  });
}

export function useOrganisation(id: string | undefined) {
  return useQuery({
    queryKey: ["organisations", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("organisations")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (org: TablesInsert<"organisations">) => {
      const { data, error } = await supabase
        .from("organisations")
        .insert(org)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}
