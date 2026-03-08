import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

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
      if (error) throw error;
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
      if (error) throw error;
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
    },
  });
}
