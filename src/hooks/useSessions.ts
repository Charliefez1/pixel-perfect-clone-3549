import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Session = Tables<"sessions"> & {
  projects?: { name: string; organisations?: { name: string } | null } | null;
};

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, projects(name, organisations(name))")
        .order("session_date", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading sessions"); return []; }
      return data as Session[];
    },
  });
}

export function useUpcomingSessions() {
  return useQuery({
    queryKey: ["sessions", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, projects(name, organisations(name))")
        .gte("session_date", new Date().toISOString())
        .order("session_date", { ascending: true })
        .limit(10);
      if (error) { handleSupabaseError(error, "Loading upcoming sessions"); return []; }
      return data as Session[];
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: TablesInsert<"sessions">) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating session"),
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"sessions"> & { id: string }) => {
      const { data, error } = await supabase.from("sessions").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating session"),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting session"),
  });
}
