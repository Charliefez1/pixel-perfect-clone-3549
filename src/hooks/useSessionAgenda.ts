import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface SessionAgendaItem {
  id: string;
  session_id: string;
  title: string;
  type: string;
  duration_minutes: number;
  position: number;
  method: string | null;
  description: string | null;
  created_at: string;
}

export function useSessionAgenda(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session_agenda", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("session_agenda_items" as any)
        .select("*")
        .eq("session_id", sessionId)
        .order("position", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading agenda"); return []; }
      return data as unknown as SessionAgendaItem[];
    },
    enabled: !!sessionId,
  });
}

export function useCreateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<SessionAgendaItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("session_agenda_items" as any)
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SessionAgendaItem;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
      toast.success("Agenda item added");
    },
    onError: (error) => handleSupabaseError(error as any, "Adding agenda item"),
  });
}

export function useUpdateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, session_id, ...updates }: { id: string; session_id: string } & Partial<SessionAgendaItem>) => {
      const { data, error } = await supabase
        .from("session_agenda_items" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...(data as any), session_id };
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
      toast.success("Agenda item updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating agenda item"),
  });
}

export function useDeleteAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, session_id }: { id: string; session_id: string }) => {
      const { error } = await supabase.from("session_agenda_items" as any).delete().eq("id", id);
      if (error) throw error;
      return { session_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
      toast.success("Agenda item deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting agenda item"),
  });
}

export function useReorderAgendaItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, session_id }: { items: { id: string; position: number }[]; session_id: string }) => {
      const updates = items.map((item) =>
        supabase.from("session_agenda_items" as any).update({ position: item.position }).eq("id", item.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      return { session_id };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["session_agenda", data.session_id] });
    },
    onError: (error) => handleSupabaseError(error as any, "Reordering agenda"),
  });
}
