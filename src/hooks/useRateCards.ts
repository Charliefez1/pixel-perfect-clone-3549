import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface RateCard {
  id: string;
  name: string;
  role: string | null;
  day_rate: number | null;
  half_day_rate: number | null;
  hourly_rate: number | null;
  currency: string | null;
  valid_from: string | null;
  valid_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useRateCards() {
  return useQuery({
    queryKey: ["rate_cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rate_cards").select("*").order("name");
      if (error) { handleSupabaseError(error, "Loading rate cards"); return []; }
      return data as RateCard[];
    },
  });
}

export function useCreateRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { name: string; role?: string; day_rate?: number; half_day_rate?: number; hourly_rate?: number; valid_from?: string; valid_to?: string; notes?: string }) => {
      const { data, error } = await supabase.from("rate_cards").insert(r).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rate_cards"] }); toast.success("Rate card created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating rate card"),
  });
}

export function useUpdateRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("rate_cards").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rate_cards"] }); toast.success("Rate card updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating rate card"),
  });
}

export function useDeleteRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rate_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rate_cards"] }); toast.success("Rate card deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting rate card"),
  });
}
