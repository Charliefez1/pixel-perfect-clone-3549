import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Invoice = Tables<"invoices"> & {
  organisations?: { name: string } | null;
  projects?: { name: string } | null;
};

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, organisations(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading invoices"); return []; }
      return data as Invoice[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select("*, organisations(name), projects(name), invoice_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) { handleSupabaseError(error, "Loading invoice"); return null; }
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: TablesInsert<"invoices">) => {
      const { data, error } = await supabase
        .from("invoices")
        .insert(invoice)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating invoice"),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting invoice"),
  });
}
