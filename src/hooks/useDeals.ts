import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Deal = Tables<"deals"> & {
  organisations?: { name: string } | null;
  contacts?: { first_name: string; last_name: string } | null;
};

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, organisations(name), contacts(first_name, last_name)")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading deals"); return []; }
      return data as Deal[];
    },
  });
}

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: ["deals", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("deals")
        .select("*, organisations(name), contacts(first_name, last_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) { handleSupabaseError(error, "Loading deal"); return null; }
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: TablesInsert<"deals">) => {
      const { data, error } = await supabase
        .from("deals")
        .insert(deal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating deal"),
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"deals"> & { id: string }) => {
      const { data, error } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating deal"),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting deal"),
  });
}
