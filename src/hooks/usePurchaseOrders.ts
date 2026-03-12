import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  organisation_id: string | null;
  project_id: string | null;
  description: string | null;
  category: string | null;
  amount: number | null;
  status: string;
  issue_date: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  organisations?: { name: string } | null;
  projects?: { name: string } | null;
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, organisations(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading purchase orders"); return []; }
      return data as PurchaseOrder[];
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (po: { po_number: string; organisation_id?: string | null; project_id?: string | null; description?: string; category?: string; amount?: number; notes?: string }) => {
      const { data, error } = await supabase.from("purchase_orders").insert(po).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Purchase order created"); },
    onError: (error) => handleSupabaseError(error as any, "Creating purchase order"),
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase.from("purchase_orders").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Purchase order updated"); },
    onError: (error) => handleSupabaseError(error as any, "Updating purchase order"),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Purchase order deleted"); },
    onError: (error) => handleSupabaseError(error as any, "Deleting purchase order"),
  });
}
