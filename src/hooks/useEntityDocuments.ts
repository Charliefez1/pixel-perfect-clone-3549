import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";

export type EntityDocument = {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string | null;
};

export function useEntityDocuments(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["entity_documents", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("entity_documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (error) { handleSupabaseError(error, "Loading documents"); return []; }
      return data as EntityDocument[];
    },
    enabled: !!entityId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: string;
      entityId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = `${entityType}/${entityId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("entity_documents")
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          uploaded_by: user?.id || null,
        });
      if (insertError) throw insertError;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["entity_documents", vars.entityType, vars.entityId] });
      toast.success("File uploaded");
    },
    onError: (error) => handleSupabaseError(error as any, "Uploading file"),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: EntityDocument) => {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("entity_documents")
        .delete()
        .eq("id", doc.id);
      if (dbError) throw dbError;
    },
    onSuccess: (_, doc) => {
      queryClient.invalidateQueries({ queryKey: ["entity_documents", doc.entity_type, doc.entity_id] });
      toast.success("File deleted");
    },
    onError: (error) => handleSupabaseError(error as any, "Deleting file"),
  });
}

export function useDownloadDocument() {
  return async (doc: EntityDocument) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(doc.file_path);
    if (error) {
      handleSupabaseError(error as any, "Downloading file");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };
}
