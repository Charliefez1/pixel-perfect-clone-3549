import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export interface DeliveryTask {
  id: string;
  delivery_id: string;
  title: string;
  assignee: string | null;
  status: string;
  due_date: string | null;
  sort_order: number | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  deal_id: string | null;
  organisation_id: string | null;
  project_id: string | null;
  form_id: string | null;
  facilitator_id: string | null;
  title: string;
  service_type: string | null;
  status: string;
  delivery_date: string | null;
  delegate_count: number | null;
  satisfaction_score: number | null;
  neuro_stage: string | null;
  kirkpatrick_level: number | null;
  feedback_sent: boolean | null;
  feedback_received: boolean | null;
  pre_assessment_complete: boolean | null;
  post_assessment_complete: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  organisations?: { name: string } | null;
  deals?: { title: string } | null;
  forms?: { title: string }[] | null;
  delivery_tasks?: DeliveryTask[];
}

export interface Template {
  id: string;
  name: string;
  service_type: string | null;
  package_size: string | null;
  tasks_json: Array<{ title: string; assignee: string; relative_due_days: number }>;
  created_at: string;
}

export function useDeliveries() {
  return useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, organisations(name), deals(title), forms(title)")
        .order("delivery_date", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading deliveries"); return []; }
      return data as Delivery[];
    },
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: ["deliveries", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, organisations(name), deals(title), forms(title)")
        .eq("id", id)
        .maybeSingle();
      if (error) { handleSupabaseError(error, "Loading delivery"); return null; }
    },
    enabled: !!id,
  });
}

export function useDeliveryTasks(deliveryId: string | undefined) {
  return useQuery({
    queryKey: ["delivery_tasks", deliveryId],
    queryFn: async () => {
      if (!deliveryId) return [];
      const { data, error } = await supabase
        .from("delivery_tasks")
        .select("*")
        .eq("delivery_id", deliveryId)
        .order("sort_order", { ascending: true });
      if (error) { handleSupabaseError(error, "Loading delivery tasks"); return []; }
      return data as DeliveryTask[];
    },
    enabled: !!deliveryId,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (delivery: Partial<Delivery>) => {
      const { data, error } = await supabase
        .from("deliveries")
        .insert(delivery as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Delivery created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating delivery"),
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Delivery> & { id: string }) => {
      const { data, error } = await supabase
        .from("deliveries")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Delivery updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating delivery"),
  });
}

export function useUpdateDeliveryTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryTask> & { id: string }) => {
      const { data, error } = await supabase
        .from("delivery_tasks")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["delivery_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Task updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating task"),
  });
}

export function useDeleteDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliveries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Delivery deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting delivery"),
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("name");
      if (error) { handleSupabaseError(error, "Loading templates"); return []; }
      return data as unknown as Template[];
    },
  });
}
