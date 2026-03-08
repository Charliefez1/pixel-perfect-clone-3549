import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Form {
  id: string;
  title: string;
  type: string | null;
  description: string | null;
  fields_json: any;
  active: boolean | null;
  responses_count: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Form[];
    },
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: { title: string; type?: string; description?: string }) => {
      const { data, error } = await supabase.from("forms").insert(f).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("forms").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forms"] }),
  });
}
