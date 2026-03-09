import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormResponse {
  id: string;
  form_id: string;
  project_id: string | null;
  delivery_id: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  answers: Record<string, any>;
  submitted_at: string;
}

export function useFormResponses(formId: string | undefined) {
  return useQuery({
    queryKey: ["form_responses", formId],
    queryFn: async () => {
      if (!formId) return [];
      const { data, error } = await (supabase as any)
        .from("form_responses")
        .select("*")
        .eq("form_id", formId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FormResponse[];
    },
    enabled: !!formId,
  });
}

export function useCreateFormResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (response: {
      form_id: string;
      project_id?: string | null;
      delivery_id?: string | null;
      respondent_name?: string | null;
      respondent_email?: string | null;
      answers: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from("form_responses")
        .insert(response)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["form_responses", variables.form_id] });
      qc.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
