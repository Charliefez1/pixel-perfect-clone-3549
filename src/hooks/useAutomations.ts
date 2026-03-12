import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Automation = Tables<"automations">;
export type AutomationLog = Tables<"automation_logs">;

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading automations"); return []; }
      return data as Automation[];
    },
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (auto: TablesInsert<"automations">) => {
      const { data, error } = await supabase
        .from("automations")
        .insert(auto)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Automation created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating automation"),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Automation>) => {
      const { data, error } = await supabase
        .from("automations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Automation updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating automation"),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Automation deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting automation"),
  });
}

export function useAutomationLogs(automationId?: string) {
  return useQuery({
    queryKey: ["automation_logs", automationId],
    queryFn: async () => {
      const query = supabase
        .from("automation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (automationId) query.eq("automation_id", automationId);
      const { data, error } = await query;
      if (error) { handleSupabaseError(error, "Loading automation logs"); return []; }
      return data as AutomationLog[];
    },
    enabled: !!automationId || automationId === undefined,
  });
}
