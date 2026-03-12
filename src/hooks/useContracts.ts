import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface Contract {
  id: string;
  deal_id: string | null;
  organisation_id: string | null;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  signed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  organisations?: { name: string } | null;
  deals?: { title: string } | null;
}

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, organisations(name), deals(title)")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading contracts"); return []; }
      return data as Contract[];
    },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { title: string; deal_id?: string | null; organisation_id?: string | null; value?: number; start_date?: string; end_date?: string; notes?: string }) => {
      const { data, error } = await supabase.from("contracts").insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); toast.success("Contract created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating contract"),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("contracts").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); toast.success("Contract updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating contract"),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts"] }); toast.success("Contract deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting contract"),
  });
}
