import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

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
      if (error) { handleSupabaseError(error, "Loading forms"); return []; }
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forms"] }); toast.success("Form created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating form"),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forms"] }); toast.success("Form updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating form"),
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forms"] }); toast.success("Form deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting form"),
  });
}
