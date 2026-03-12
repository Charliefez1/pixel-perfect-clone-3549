-- ==================================================
-- Security Phase 1: Storage isolation
-- ==================================================
-- REVIEWER FIX #3: Verified actual storage paths. Upload code uses:
--   {entityType}/{entityId}/{timestamp}_{filename}
-- NOT {organisation_id}/... as originally assumed.
--
-- Adapted policy: admin/team get full access. Client read access uses
-- entity_documents table to validate the file belongs to an entity in their org.
-- This joins: storage.objects.name → entity_documents.file_path → entity_id → projects.organisation_id
--
-- NOTE: This currently only resolves project-type entities for client access.
-- Other entity types (contacts, etc.) would need additional JOIN branches as the
-- platform expands. For now, project-scoped documents cover the primary use case.

-- Drop existing permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;

-- Admin/team: full access to all documents
CREATE POLICY "admin_team_full_storage" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_admin_or_team(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND public.is_admin_or_team(auth.uid())
  );

-- Client: read-only access to documents belonging to entities in their org
-- Joins through entity_documents to resolve org ownership
CREATE POLICY "client_read_own_org_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1
      FROM public.entity_documents ed
      JOIN public.projects p ON p.id = ed.entity_id::uuid
      WHERE ed.file_path = storage.objects.name
        AND ed.entity_type = 'project'
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );
