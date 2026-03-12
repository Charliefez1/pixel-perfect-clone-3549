import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { TablesUpdate } from "@/integrations/supabase/types";

export function useUpdateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"organisations"> & { id: string }) => {
      const { data, error } = await supabase
        .from("organisations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations"] });
      toast.success("Organisation updated");
    },
    onError: (error) => handleSupabaseError(error as any, "Updating organisation"),
  });
}
