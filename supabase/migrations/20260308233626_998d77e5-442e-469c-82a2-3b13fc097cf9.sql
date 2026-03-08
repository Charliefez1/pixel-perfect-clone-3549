
-- ============================================================
-- 1. TIGHTEN RLS POLICIES: Replace USING(true) with has_role admin checks
-- ============================================================

-- CONTACTS
DROP POLICY IF EXISTS "Authenticated users can CRUD contacts" ON public.contacts;
CREATE POLICY "Admins can CRUD contacts" ON public.contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Portal users view own org contacts" ON public.contacts FOR SELECT TO authenticated
  USING (public.can_access_org(auth.uid(), organisation_id));

-- CONTRACTS
DROP POLICY IF EXISTS "Authenticated users can CRUD contracts" ON public.contracts;
CREATE POLICY "Admins can CRUD contracts" ON public.contracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Portal users view own org contracts" ON public.contracts FOR SELECT TO authenticated
  USING (public.can_access_org(auth.uid(), organisation_id));

-- DEALS
DROP POLICY IF EXISTS "Authenticated users can CRUD deals" ON public.deals;
CREATE POLICY "Admins can CRUD deals" ON public.deals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ORGANISATIONS
DROP POLICY IF EXISTS "Authenticated users can CRUD organisations" ON public.organisations;
CREATE POLICY "Admins can CRUD organisations" ON public.organisations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Portal users view own org" ON public.organisations FOR SELECT TO authenticated
  USING (public.can_access_org(auth.uid(), id));

-- PROJECTS
DROP POLICY IF EXISTS "Authenticated users can CRUD projects" ON public.projects;
CREATE POLICY "Admins can CRUD projects" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROPOSALS
DROP POLICY IF EXISTS "Authenticated users can CRUD proposals" ON public.proposals;
CREATE POLICY "Admins can CRUD proposals" ON public.proposals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TASKS
DROP POLICY IF EXISTS "Authenticated users can CRUD tasks" ON public.tasks;
CREATE POLICY "Admins can CRUD tasks" ON public.tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SESSIONS
DROP POLICY IF EXISTS "Authenticated users can CRUD sessions" ON public.sessions;
CREATE POLICY "Admins can CRUD sessions" ON public.sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- COMMENTS
DROP POLICY IF EXISTS "Authenticated users can CRUD comments" ON public.comments;
CREATE POLICY "Admins can CRUD comments" ON public.comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DELIVERY_TASKS
DROP POLICY IF EXISTS "Authenticated users can CRUD delivery_tasks" ON public.delivery_tasks;
CREATE POLICY "Admins can CRUD delivery_tasks" ON public.delivery_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FORMS
DROP POLICY IF EXISTS "Authenticated users can CRUD forms" ON public.forms;
CREATE POLICY "Admins can CRUD forms" ON public.forms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- INVOICE_ITEMS
DROP POLICY IF EXISTS "Authenticated users can CRUD invoice items" ON public.invoice_items;
CREATE POLICY "Admins can CRUD invoice_items" ON public.invoice_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROJECT_MILESTONES
DROP POLICY IF EXISTS "Authenticated users can CRUD project_milestones" ON public.project_milestones;
CREATE POLICY "Admins can CRUD project_milestones" ON public.project_milestones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PURCHASE_ORDERS
DROP POLICY IF EXISTS "Authenticated users can CRUD purchase_orders" ON public.purchase_orders;
CREATE POLICY "Admins can CRUD purchase_orders" ON public.purchase_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RATE_CARDS
DROP POLICY IF EXISTS "Authenticated users can CRUD rate_cards" ON public.rate_cards;
CREATE POLICY "Admins can CRUD rate_cards" ON public.rate_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SERVICES
DROP POLICY IF EXISTS "Authenticated users can CRUD services" ON public.services;
CREATE POLICY "Admins can CRUD services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TEMPLATES
DROP POLICY IF EXISTS "Authenticated users can CRUD templates" ON public.templates;
CREATE POLICY "Admins can CRUD templates" ON public.templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TIME_ENTRIES
DROP POLICY IF EXISTS "Authenticated users can CRUD time_entries" ON public.time_entries;
CREATE POLICY "Admins can CRUD time_entries" ON public.time_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ACTIVITY_LOG: tighten INSERT
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated users can view activity" ON public.activity_log;
CREATE POLICY "Admins can view activity_log" ON public.activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert activity_log" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. ADD PROPER FK ON DELETE BEHAVIOR
-- ============================================================

-- contacts → organisations
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_organisation_id_fkey;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- deals → organisations
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_organisation_id_fkey;
ALTER TABLE public.deals ADD CONSTRAINT deals_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- deals → contacts
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_contact_id_fkey;
ALTER TABLE public.deals ADD CONSTRAINT deals_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

-- projects → organisations
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_organisation_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- projects → deals
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_deal_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- proposals → deals
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_deal_id_fkey;
ALTER TABLE public.proposals ADD CONSTRAINT proposals_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- proposals → organisations
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_organisation_id_fkey;
ALTER TABLE public.proposals ADD CONSTRAINT proposals_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- contracts → deals
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_deal_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- contracts → organisations
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_organisation_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- contracts → proposals
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_proposal_id_fkey;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_proposal_id_fkey
  FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE SET NULL;

-- invoices → organisations
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_organisation_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- invoices → deals
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_deal_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- invoices → projects
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- invoices → contracts
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_contract_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- invoice_items → invoices (CASCADE - delete items with invoice)
ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- deliveries → deals
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_deal_id_fkey;
ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- deliveries → organisations
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_organisation_id_fkey;
ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- deliveries → projects
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_project_id_fkey;
ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- delivery_tasks → deliveries (CASCADE)
ALTER TABLE public.delivery_tasks DROP CONSTRAINT IF EXISTS delivery_tasks_delivery_id_fkey;
ALTER TABLE public.delivery_tasks ADD CONSTRAINT delivery_tasks_delivery_id_fkey
  FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;

-- tasks → projects
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- sessions → projects
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_project_id_fkey;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- time_entries → projects
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_project_id_fkey;
ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- time_entries → tasks
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;
ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;

-- comments → deals
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_deal_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

-- comments → projects
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_project_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- comments → tasks
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_task_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

-- project_milestones → projects (CASCADE)
ALTER TABLE public.project_milestones DROP CONSTRAINT IF EXISTS project_milestones_project_id_fkey;
ALTER TABLE public.project_milestones ADD CONSTRAINT project_milestones_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- purchase_orders → organisations
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_organisation_id_fkey;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- purchase_orders → projects
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_project_id_fkey;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- activities → contacts
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_contact_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

-- activities → deals
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_deal_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

-- activities → organisations
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_organisation_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;

-- client_portal_access → organisations
ALTER TABLE public.client_portal_access DROP CONSTRAINT IF EXISTS client_portal_access_organisation_id_fkey;
ALTER TABLE public.client_portal_access ADD CONSTRAINT client_portal_access_organisation_id_fkey
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;

-- user_roles → auth.users
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
