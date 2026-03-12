import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
  created_at: string;
}

export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice_items", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at");
      if (error) { handleSupabaseError(error, "Loading invoice items"); return []; }
      return data as InvoiceItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoiceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: { invoice_id: string; description: string; quantity: number; unit_price: number; total: number }) => {
      const { data, error } = await supabase
        .from("invoice_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice_items"] });
      toast.success("Invoice item added");
    },
    onError: (error) => handleSupabaseError(error as any, "Adding invoice item"),
  });
}
