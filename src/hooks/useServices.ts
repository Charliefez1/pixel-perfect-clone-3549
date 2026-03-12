import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface Service {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  default_duration_days: number | null;
  default_price: number | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("name");
      if (error) { handleSupabaseError(error, "Loading services"); return []; }
      return data as Service[];
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { name: string; category?: string; description?: string; default_duration_days?: number; default_price?: number }) => {
      const { data, error } = await supabase.from("services").insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating service"),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("services").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating service"),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting service"),
  });
}
