import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeEntry {
  id: string;
  user_id: string | null;
  project_id: string | null;
  task_id: string | null;
  description: string | null;
  date: string;
  duration_minutes: number;
  billable: boolean | null;
  created_at: string;
  updated_at: string;
  projects?: { name: string; organisations?: { name: string } | null } | null;
  tasks?: { title: string } | null;
}

export function useTimeEntries() {
  return useQuery({
    queryKey: ["time_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, projects(name, organisations(name)), tasks(title)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as TimeEntry[];
    },
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { project_id?: string | null; task_id?: string | null; description?: string; date?: string; duration_minutes: number; billable?: boolean }) => {
      const { data, error } = await supabase.from("time_entries").insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });
}
