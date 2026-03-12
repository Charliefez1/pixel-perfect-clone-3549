import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Contact = Tables<"contacts"> & {
  organisations?: { name: string } | null;
};

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, organisations(name)")
        .order("last_name");
      if (error) { handleSupabaseError(error, "Loading contacts"); return []; }
      return data as Contact[];
    },
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("contacts")
        .select("*, organisations(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) { handleSupabaseError(error, "Loading contact"); return null; }
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: TablesInsert<"contacts">) => {
      const { data, error } = await supabase
        .from("contacts")
        .insert(contact)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created");
    },
    onError: (error) => handleSupabaseError(error as any, "Creating contact"),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting contact"),
  });
}
