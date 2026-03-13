import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface PortalMessage {
  id: string;
  organisation_id: string;
  project_id: string | null;
  sender_id: string | null;
  sender_type: string;
  sender_name: string | null;
  content: string;
  body: string;
  is_admin: boolean;
  created_at: string;
}

export function usePortalMessages(organisationId: string | undefined) {
  return useQuery({
    queryKey: ["portal_messages", organisationId],
    queryFn: async () => {
      if (!organisationId) return [];
      const { data, error } = await supabase
        .from("portal_messages" as any)
        .select("*")
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading messages"); return []; }
      return data as unknown as PortalMessage[];
    },
    enabled: !!organisationId,
  });
}

export function useCreatePortalMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: Record<string, any>) => {
      const { data, error } = await supabase
        .from("portal_messages" as any)
        .insert(msg)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PortalMessage;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["portal_messages", data.organisation_id] });
      toast.success("Message sent");
    },
    onError: (error) => handleSupabaseError(error as any, "Sending message"),
  });
}
