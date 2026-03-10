import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type SessionAgendaItem = Tables<"session_agenda_items">;

export function useSessionAgenda(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session_agenda", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("session_agenda_items")
        .select("*")
        .eq("session_id", sessionId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as SessionAgendaItem[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<"session_agenda_items">) => {
      const { data, error } = await supabase
        .from("session_agenda_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", variables.session_id] });
    },
  });
}

export function useUpdateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, session_id, ...updates }: { id: string; session_id: string } & Partial<SessionAgendaItem>) => {
      const { data, error } = await supabase
        .from("session_agenda_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, session_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
    },
  });
}

export function useDeleteAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, session_id }: { id: string; session_id: string }) => {
      const { error } = await supabase.from("session_agenda_items").delete().eq("id", id);
      if (error) throw error;
      return { session_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
    },
  });
}

export function useReorderAgendaItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, session_id }: { items: { id: string; position: number }[]; session_id: string }) => {
      for (const item of items) {
        await supabase.from("session_agenda_items").update({ position: item.position }).eq("id", item.id);
      }
      return { session_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
    },
  });
}
