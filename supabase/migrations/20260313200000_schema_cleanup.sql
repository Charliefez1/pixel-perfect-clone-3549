-- ===========================================================================
-- Schema Cleanup Migration
-- Consolidates missing pieces found by auditing all 31 prior migrations
-- and all hooks in src/hooks/ for .from("tablename") references.
-- ===========================================================================

-- =============================================
-- 1. Ensure app_role enum includes all 4 values
-- =============================================
-- 'admin' and 'user' were created in 20260308040541 (initial schema).
-- 'team' and 'client' were added in 20260312100000 (security phase 1).
-- Using IF NOT EXISTS makes this idempotent.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- =============================================
-- 2. Tables referenced in code but missing
--    from migrations
-- =============================================

-- 2a. entity_documents: referenced by useEntityDocuments hook and by
--     the storage RLS policy in 20260312100003_security_phase1_storage.sql
--     which joins entity_documents.file_path to storage.objects.name.
--     No migration ever created this table.
CREATE TABLE IF NOT EXISTS public.entity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_documents ENABLE ROW LEVEL SECURITY;

-- Admin/team full access (matches security phase 1 pattern)
CREATE POLICY "admin_team_all_entity_documents" ON public.entity_documents
  FOR ALL TO authenticated
  USING (public.is_admin_or_team(auth.uid()));

-- Client read access scoped through project org
CREATE POLICY "client_read_entity_documents" ON public.entity_documents
  FOR SELECT TO authenticated
  USING (
    entity_type = 'project'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = entity_documents.entity_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- 2b. COMMENT: The "documents" references in useEntityDocuments.ts are
--     supabase.storage.from("documents") calls (a storage bucket, not a
--     table). No additional table creation is needed.

-- =============================================
-- 3. Missing indexes on frequently queried
--    columns: entity_id, project_id,
--    organisation_id, user_id, deal_id
-- =============================================

-- ---- activity_log ----
-- Composite (entity_type, entity_id) exists from initial migration.
-- Add standalone entity_id for hooks that filter only by entity_id.
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_id
  ON public.activity_log (entity_id);

-- user_id: useActivityLog filters by user_id
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id
  ON public.activity_log (user_id);

-- ---- deliveries ----
-- project_id: added in 20260308162652 but never indexed; used in RLS joins and hooks
CREATE INDEX IF NOT EXISTS idx_deliveries_project_id
  ON public.deliveries (project_id);

-- organisation_id: used in RLS org-scoping policies
CREATE INDEX IF NOT EXISTS idx_deliveries_organisation_id
  ON public.deliveries (organisation_id);

-- deal_id: FK column, queried in useDeliveries hook and useReportingData
CREATE INDEX IF NOT EXISTS idx_deliveries_deal_id
  ON public.deliveries (deal_id);

-- ---- invoices ----
-- project_id: queried in useInvoices, useReportingData, useDashboardStats
CREATE INDEX IF NOT EXISTS idx_invoices_project_id
  ON public.invoices (project_id);

-- organisation_id: used in RLS policies and hook filters
CREATE INDEX IF NOT EXISTS idx_invoices_organisation_id
  ON public.invoices (organisation_id);

-- deal_id: FK column, used in reporting
CREATE INDEX IF NOT EXISTS idx_invoices_deal_id
  ON public.invoices (deal_id);

-- ---- sessions ----
-- project_id: queried in useSessions hook, used in client RLS join
CREATE INDEX IF NOT EXISTS idx_sessions_project_id
  ON public.sessions (project_id);

-- ---- deals ----
-- organisation_id: used in RLS org-scoping
CREATE INDEX IF NOT EXISTS idx_deals_organisation_id
  ON public.deals (organisation_id);

-- contact_id: FK column, queried in pipeline views
CREATE INDEX IF NOT EXISTS idx_deals_contact_id
  ON public.deals (contact_id);

-- ---- projects ----
-- organisation_id: used in RLS policies and hook filters
CREATE INDEX IF NOT EXISTS idx_projects_organisation_id
  ON public.projects (organisation_id);

-- deal_id: FK column, project-deal linking
CREATE INDEX IF NOT EXISTS idx_projects_deal_id
  ON public.projects (deal_id);

-- ---- proposals ----
-- deal_id: FK column, queried in useProposals
CREATE INDEX IF NOT EXISTS idx_proposals_deal_id
  ON public.proposals (deal_id);

-- organisation_id: used in client RLS scoping
CREATE INDEX IF NOT EXISTS idx_proposals_organisation_id
  ON public.proposals (organisation_id);

-- ---- contracts ----
-- deal_id: FK column, queried in useContracts
CREATE INDEX IF NOT EXISTS idx_contracts_deal_id
  ON public.contracts (deal_id);

-- organisation_id: used in client RLS scoping
CREATE INDEX IF NOT EXISTS idx_contracts_organisation_id
  ON public.contracts (organisation_id);

-- ---- purchase_orders ----
-- organisation_id: used in client RLS scoping
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organisation_id
  ON public.purchase_orders (organisation_id);

-- project_id: FK column, queried in usePurchaseOrders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id
  ON public.purchase_orders (project_id);

-- ---- time_entries ----
-- project_id: FK column, used in client RLS join and useTimeEntries
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id
  ON public.time_entries (project_id);

-- user_id: per-user time tracking queries
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id
  ON public.time_entries (user_id);

-- ---- activities ----
-- organisation_id: used in client RLS scoping and useActivities filtering
CREATE INDEX IF NOT EXISTS idx_activities_organisation_id
  ON public.activities (organisation_id);

-- deal_id: FK column, activity-deal linking
CREATE INDEX IF NOT EXISTS idx_activities_deal_id
  ON public.activities (deal_id);

-- contact_id: FK column, activity-contact linking
CREATE INDEX IF NOT EXISTS idx_activities_contact_id
  ON public.activities (contact_id);

-- ---- entity_links ----
-- source_type + source_id: queried via OR filter in useEntityLinks
CREATE INDEX IF NOT EXISTS idx_entity_links_source
  ON public.entity_links (source_type, source_id);

-- target_type + target_id: queried via OR filter in useEntityLinks
CREATE INDEX IF NOT EXISTS idx_entity_links_target
  ON public.entity_links (target_type, target_id);

-- ---- entity_documents ----
-- entity_type + entity_id: queried in useEntityDocuments hook
CREATE INDEX IF NOT EXISTS idx_entity_documents_entity
  ON public.entity_documents (entity_type, entity_id);

-- ---- project_notes ----
-- project_id: queried in useProjectNotes hook
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id
  ON public.project_notes (project_id);

-- ---- project_updates ----
-- project_id: queried in useProjectUpdates hook
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id
  ON public.project_updates (project_id);

-- ---- form_responses ----
-- form_id: FK column, queried in useFormResponses hook
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id
  ON public.form_responses (form_id);

-- project_id: FK column, used in form response filtering
CREATE INDEX IF NOT EXISTS idx_form_responses_project_id
  ON public.form_responses (project_id);

-- ---- portal_messages ----
-- organisation_id: used in RLS org-scoping and usePortalMessages
CREATE INDEX IF NOT EXISTS idx_portal_messages_organisation_id
  ON public.portal_messages (organisation_id);

-- project_id: FK column, used in message filtering
CREATE INDEX IF NOT EXISTS idx_portal_messages_project_id
  ON public.portal_messages (project_id);

-- ---- comments ----
-- deal_id, project_id, task_id: polymorphic FK columns
CREATE INDEX IF NOT EXISTS idx_comments_deal_id
  ON public.comments (deal_id);

CREATE INDEX IF NOT EXISTS idx_comments_project_id
  ON public.comments (project_id);

CREATE INDEX IF NOT EXISTS idx_comments_task_id
  ON public.comments (task_id);

-- ---- invoice_items ----
-- invoice_id: FK column, queried in useInvoiceItems hook
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
  ON public.invoice_items (invoice_id);

-- ---- session_agenda_items ----
-- session_id: FK column, queried in useSessionAgenda hook
CREATE INDEX IF NOT EXISTS idx_session_agenda_items_session_id
  ON public.session_agenda_items (session_id);

-- ---- user_org_access ----
-- user_id: frequently checked in user_has_org_access() security definer function
CREATE INDEX IF NOT EXISTS idx_user_org_access_user_id
  ON public.user_org_access (user_id);

-- organisation_id: for admin lookups of who has access to an org
CREATE INDEX IF NOT EXISTS idx_user_org_access_organisation_id
  ON public.user_org_access (organisation_id);

-- ---- automations ----
-- No specific FK columns to index beyond PK.
-- automation_logs.automation_id is a FK but low volume.

-- NOTE: The following indexes already exist from prior migrations and
-- are NOT recreated here:
--   idx_deals_stage, idx_deals_owner (initial)
--   idx_tasks_status, idx_tasks_assignee, idx_tasks_project (initial)
--   idx_projects_status (initial)
--   idx_invoices_status (initial)
--   idx_activity_log_entity (composite, initial)
--   idx_notifications_user (initial)
--   idx_contacts_org (initial)
--   idx_contacts_last_contacted (20260308152429)
--   idx_project_milestones_project_id (20260308155029)

-- =============================================
-- 4. Comment: tables referenced in code that
--    don't exist in any migration
-- =============================================
-- After auditing all hooks in src/hooks/ for .from("tablename") calls,
-- the following tables are referenced in code:
--
--   Hook file                    Table(s) referenced
--   -------------------------    ----------------------------
--   useActivities.ts             activities
--   useActivityLog.ts            activity_log
--   useAuth.tsx                  profiles, user_roles
--   useAutomations.ts            automations, automation_logs
--   useContacts.ts               contacts
--   useContracts.ts              contracts
--   useDashboardStats.ts         projects, tasks, invoices, deliveries
--   useDeals.ts                  deals
--   useDeliveries.ts             deliveries, delivery_tasks, templates
--   useEntityDocuments.ts        entity_documents (+ storage bucket "documents")
--   useEntityLinks.ts            entity_links
--   useFormResponses.ts          form_responses
--   useForms.ts                  forms
--   useInvoiceItems.ts           invoice_items
--   useInvoices.ts               invoices
--   useOrganisations.ts          organisations
--   usePortalMessages.ts         portal_messages
--   useProjectMilestones.ts      project_milestones
--   useProjectNotes.ts           project_notes
--   useProjectUpdates.ts         project_updates
--   useProjects.ts               projects
--   useProposals.ts              proposals
--   usePurchaseOrders.ts         purchase_orders
--   useRateCards.ts              rate_cards
--   useReportingData.ts          invoices, deals, deliveries
--   useServices.ts               services
--   useSessionAgenda.ts          session_agenda_items
--   useSessions.ts               sessions
--   useTasks.ts                  tasks
--   useTimeEntries.ts            time_entries
--   useUpdateContact.ts          contacts
--   useUpdateInvoice.ts          invoices
--   useUpdateOrganisation.ts     organisations
--
-- ALL tables above have migrations EXCEPT entity_documents, which is
-- created in section 2a of this migration. The "documents" reference
-- is a Supabase storage bucket, not a database table.

-- =============================================
-- 5. Ensure handle_new_user() trigger function
--    sets profiles.role = 'client' for new users
-- =============================================
-- The function was updated in 20260312100000_security_phase1_roles.sql
-- to insert role='client'. We re-apply it here as the canonical version
-- to guarantee correctness regardless of prior migration state.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger is attached (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 6. Drop and recreate RLS policies that
--    reference security functions and may
--    conflict with earlier migrations
-- =============================================
-- The security phase 1 migrations (20260312100000 through 20260312100002)
-- introduced is_admin_or_team() and user_has_org_access() and created
-- policies on most tables. However, some tables from sprint 3/4
-- (project_notes, entity_links) were created after the initial security
-- pass and still had permissive USING(true) policies that were never
-- replaced. Additionally, the earlier 20260308233626 migration created
-- has_role()-based policies that may conflict. We clean all of these up.

-- 6a. project_notes: drop old permissive policy, add proper admin/team + client
DROP POLICY IF EXISTS "Users can manage project notes" ON public.project_notes;
DROP POLICY IF EXISTS "admin_team_all_project_notes" ON public.project_notes;
DROP POLICY IF EXISTS "client_read_project_notes" ON public.project_notes;

CREATE POLICY "admin_team_all_project_notes" ON public.project_notes
  FOR ALL TO authenticated
  USING (public.is_admin_or_team(auth.uid()));

CREATE POLICY "client_read_project_notes" ON public.project_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_notes.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- 6b. entity_links: drop old permissive policy, add proper admin/team
DROP POLICY IF EXISTS "Users can manage entity links" ON public.entity_links;
DROP POLICY IF EXISTS "admin_team_all_entity_links" ON public.entity_links;

CREATE POLICY "admin_team_all_entity_links" ON public.entity_links
  FOR ALL TO authenticated
  USING (public.is_admin_or_team(auth.uid()));

-- 6c. project_updates: drop any leftover legacy permissive policies
--     (admin_team_all_project_updates and client_read_project_updates were
--     already created in 20260312100001 and 20260312100002)
DROP POLICY IF EXISTS "Authenticated users can read project updates" ON public.project_updates;
DROP POLICY IF EXISTS "Authenticated users can insert project updates" ON public.project_updates;
DROP POLICY IF EXISTS "Authenticated users can update project updates" ON public.project_updates;
DROP POLICY IF EXISTS "Authenticated users can delete project updates" ON public.project_updates;

-- 6d. Drop stale has_role()-based policies from 20260308233626 that were
--     superseded by is_admin_or_team() policies in security phase 1.
--     These may already be gone, but we ensure cleanup.
DROP POLICY IF EXISTS "Admins can CRUD contacts" ON public.contacts;
DROP POLICY IF EXISTS "Portal users view own org contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can CRUD contracts" ON public.contracts;
DROP POLICY IF EXISTS "Portal users view own org contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can CRUD deals" ON public.deals;
DROP POLICY IF EXISTS "Admins can CRUD organisations" ON public.organisations;
DROP POLICY IF EXISTS "Portal users view own org" ON public.organisations;
DROP POLICY IF EXISTS "Admins can CRUD projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can CRUD proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can CRUD tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can CRUD sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can CRUD comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can CRUD delivery_tasks" ON public.delivery_tasks;
DROP POLICY IF EXISTS "Admins can CRUD forms" ON public.forms;
DROP POLICY IF EXISTS "Admins can CRUD invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can CRUD project_milestones" ON public.project_milestones;
DROP POLICY IF EXISTS "Admins can CRUD purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Admins can CRUD rate_cards" ON public.rate_cards;
DROP POLICY IF EXISTS "Admins can CRUD services" ON public.services;
DROP POLICY IF EXISTS "Admins can CRUD templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can CRUD time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can view activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Admins can insert activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Admins full access to deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Portal users view own org deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Admins full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Portal users view own org invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins full access to activities" ON public.activities;
DROP POLICY IF EXISTS "Portal users view own org activities" ON public.activities;

-- 6e. Drop stale storage policies from 20260309091153 that were replaced
--     by security phase 1 storage policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- ===========================================================================
-- End of schema cleanup migration
-- ===========================================================================
