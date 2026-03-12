import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
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
      if (error) { handleSupabaseError(error, "Loading organisations"); return []; }
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
      if (error) { handleSupabaseError(error, "Loading organisation"); return null; }
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
      toast.success("Organisation created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating organisation"),
  });
}

export function useDeleteOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organisations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
      toast.success("Organisation deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting organisation"),
  });
}
