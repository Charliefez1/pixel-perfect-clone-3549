-- ==================================================
-- Security Phase 1: ATOMIC drop-and-replace of all RLS policies
-- ==================================================
-- This migration drops all permissive policies and recreates proper ones in a single transaction.
-- Postgres migrations run in a transaction by default, so there is no window of exposure.

-- ============================
-- PART A: Drop all permissive policies
-- ============================

-- From initial migration (20260308040541)
DROP POLICY IF EXISTS "Authenticated users can CRUD organisations" ON public.organisations;
DROP POLICY IF EXISTS "Authenticated users can CRUD contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can CRUD deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can CRUD projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can CRUD tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can CRUD sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can CRUD invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can CRUD invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Authenticated users can CRUD comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can view activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON public.activity_log;

-- From 20260308120558 (deliveries, delivery_tasks, templates)
DROP POLICY IF EXISTS "Authenticated users can manage deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Authenticated users can manage delivery tasks" ON public.delivery_tasks;
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON public.templates;

-- From 20260308122427 (time_entries, proposals, contracts, services, rate_cards, purchase_orders, forms)
DROP POLICY IF EXISTS "Authenticated users can CRUD time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Authenticated users can CRUD proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can CRUD contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can CRUD services" ON public.services;
DROP POLICY IF EXISTS "Authenticated users can CRUD rate_cards" ON public.rate_cards;
DROP POLICY IF EXISTS "Authenticated users can CRUD purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can CRUD forms" ON public.forms;

-- From 20260308124201 (activities)
DROP POLICY IF EXISTS "Authenticated users can manage activities" ON public.activities;

-- From 20260308152640 (client_portal_access)
DROP POLICY IF EXISTS "Authenticated users can manage portal access" ON public.client_portal_access;

-- From 20260308155029 (project_milestones)
DROP POLICY IF EXISTS "Authenticated users can manage milestones" ON public.project_milestones;

-- From 20260309140000 (project_updates)
DROP POLICY IF EXISTS "Authenticated users can manage project_updates" ON public.project_updates;

-- From 20260309160000 (form_responses, portal_messages)
DROP POLICY IF EXISTS "Authenticated users can manage form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Authenticated users can manage portal messages" ON public.portal_messages;
DROP POLICY IF EXISTS "Anyone can submit form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Anyone can view active forms" ON public.forms;

-- From 20260310010000 (session_agenda_items, automations, automation_logs)
DROP POLICY IF EXISTS "Authenticated users can manage agenda items" ON public.session_agenda_items;
DROP POLICY IF EXISTS "Authenticated users can manage automations" ON public.automations;
DROP POLICY IF EXISTS "Authenticated users can manage automation logs" ON public.automation_logs;

-- ============================
-- PART B: Admin/Team full access policies
-- ============================

-- Org-scoped tables: admin/team get ALL
CREATE POLICY "admin_team_all_projects" ON public.projects
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_invoices" ON public.invoices
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_invoice_items" ON public.invoice_items
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_deals" ON public.deals
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_proposals" ON public.proposals
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_contracts" ON public.contracts
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_tasks" ON public.tasks
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_deliveries" ON public.deliveries
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_time_entries" ON public.time_entries
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_activities" ON public.activities
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_contacts" ON public.contacts
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_forms" ON public.forms
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_form_responses" ON public.form_responses
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_portal_messages" ON public.portal_messages
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_purchase_orders" ON public.purchase_orders
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_comments" ON public.comments
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_project_updates" ON public.project_updates
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_sessions" ON public.sessions
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_session_agenda_items" ON public.session_agenda_items
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_project_milestones" ON public.project_milestones
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));

-- Admin/team only tables (no client access at all)
CREATE POLICY "admin_team_all_automations" ON public.automations
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_automation_logs" ON public.automation_logs
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_rate_cards" ON public.rate_cards
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_services" ON public.services
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_organisations" ON public.organisations
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_templates" ON public.templates
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_delivery_tasks" ON public.delivery_tasks
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));
CREATE POLICY "admin_team_all_client_portal_access" ON public.client_portal_access
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));

-- Activity log: admin/team can read and insert
CREATE POLICY "admin_team_all_activity_log" ON public.activity_log
  FOR ALL TO authenticated USING (public.is_admin_or_team(auth.uid()));

-- Notifications: keep user-scoped (already has proper policies).
-- Existing policies "Users can view own notifications" and "Users can update own notifications" are fine.
-- No change needed for notifications.

-- Public form submission: anyone (including anon) can submit form responses
CREATE POLICY "anyone_can_submit_form_responses" ON public.form_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Public form viewing: anyone can view active forms (for public form page)
CREATE POLICY "anyone_can_view_active_forms" ON public.forms
  FOR SELECT TO anon, authenticated
  USING (active = true);
