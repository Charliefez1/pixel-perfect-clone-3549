import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PortalMessage = Tables<"portal_messages">;

export function usePortalMessages(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["portal_messages", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const { data, error } = await supabase
        .from("portal_messages")
        .select("*")
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading messages"); return []; }
      return data as PortalMessage[];
    },
    enabled: !!organisationId,
  });
}

export function useCreatePortalMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: TablesInsert<"portal_messages">) => {
      const { data, error } = await supabase
        .from("portal_messages")
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["portal_messages", variables.organisation_id] });
      toast.success("Message sent");
    },
    onError: (error) => handleSupabaseError(error as any, "Sending message"),
  });
}
