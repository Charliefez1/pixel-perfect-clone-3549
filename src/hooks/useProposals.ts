import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface Proposal {
  id: string;
  deal_id: string | null;
  organisation_id: string | null;
  title: string;
  status: string;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  value: number | null;
  valid_until: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  organisations?: { name: string } | null;
  deals?: { title: string } | null;
}

export function useProposals() {
  return useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, organisations(name), deals(title)")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading proposals"); return []; }
      return data as Proposal[];
    },
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { title: string; deal_id?: string | null; organisation_id?: string | null; value?: number; valid_until?: string; notes?: string }) => {
      const { data, error } = await supabase.from("proposals").insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposals"] }); toast.success("Proposal created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating proposal"),
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("proposals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposals"] }); toast.success("Proposal updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating proposal"),
  });
}

export function useDeleteProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposals"] }); toast.success("Proposal deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting proposal"),
  });
}
