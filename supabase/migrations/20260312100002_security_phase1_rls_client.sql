-- ==================================================
-- Security Phase 1: Client org-scoped read-only policies
-- ==================================================

-- Client read-only access to org-scoped tables
-- Each policy: FOR SELECT only, scoped to orgs the client has access to

CREATE POLICY "client_read_projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

CREATE POLICY "client_read_invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

-- invoice_items: join through invoice to get org scope
CREATE POLICY "client_read_invoice_items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND public.user_has_org_access(auth.uid(), i.organisation_id)
    )
  );

CREATE POLICY "client_read_deals" ON public.deals
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

CREATE POLICY "client_read_proposals" ON public.proposals
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

CREATE POLICY "client_read_contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

-- tasks: join through project to get org scope
CREATE POLICY "client_read_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- deliveries: join through project
CREATE POLICY "client_read_deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = deliveries.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- time_entries: join through project
CREATE POLICY "client_read_time_entries" ON public.time_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = time_entries.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- activities: scoped by organisation_id if present
CREATE POLICY "client_read_activities" ON public.activities
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

-- contacts: scoped by organisation_id
CREATE POLICY "client_read_contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

-- forms: clients can view active forms for their org
CREATE POLICY "client_read_forms" ON public.forms
  FOR SELECT TO authenticated
  USING (
    organisation_id IS NOT NULL
    AND public.user_has_org_access(auth.uid(), organisation_id)
  );

-- form_responses: clients can view responses for their org's forms
-- REVIEWER FIX #2: Original policy checked is_admin_or_team = false but never
-- scoped to the client's org. Now joins through forms → organisation_id.
CREATE POLICY "client_read_form_responses" ON public.form_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forms f
      WHERE f.id = form_responses.form_id
        AND f.organisation_id IS NOT NULL
        AND public.user_has_org_access(auth.uid(), f.organisation_id)
    )
  );

-- portal_messages: scoped by organisation_id
CREATE POLICY "client_read_portal_messages" ON public.portal_messages
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

-- Client can also INSERT portal messages (to communicate with team)
CREATE POLICY "client_insert_portal_messages" ON public.portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.user_has_org_access(auth.uid(), organisation_id));

-- purchase_orders: scoped by organisation_id
CREATE POLICY "client_read_purchase_orders" ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), organisation_id));

-- comments: join through entity (project-scoped for now)
CREATE POLICY "client_read_comments" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = comments.entity_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- project_updates: join through project
CREATE POLICY "client_read_project_updates" ON public.project_updates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_updates.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- sessions: join through project
CREATE POLICY "client_read_sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = sessions.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- session_agenda_items: join through session -> project
CREATE POLICY "client_read_session_agenda_items" ON public.session_agenda_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.projects p ON p.id = s.project_id
      WHERE s.id = session_agenda_items.session_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- project_milestones: join through project
CREATE POLICY "client_read_project_milestones" ON public.project_milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_milestones.project_id
        AND public.user_has_org_access(auth.uid(), p.organisation_id)
    )
  );

-- Organisations: client can read their own org only
CREATE POLICY "client_read_own_organisation" ON public.organisations
  FOR SELECT TO authenticated
  USING (public.user_has_org_access(auth.uid(), id));
