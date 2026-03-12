# NDG Hub: Enterprise Security Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lock down the NDG Hub from a wide-open vibecoded prototype to an enterprise-grade platform with proper RBAC, RLS, error handling, and production hardening.

**Architecture:** Supabase RLS is the security boundary. A new three-tier role system (admin/team/client) is enforced at database level. The existing `user_roles` table and `has_role()` function are extended (not replaced) to support the new tiers. Client users are org-scoped via a `user_org_access` join table. Frontend role checks are UX convenience only.

**Tech Stack:** React 18, TypeScript, Supabase (Postgres + RLS + Edge Functions), TanStack Query, Vite, Sonner (toasts)

---

## Existing Infrastructure (READ THIS FIRST)

The codebase already has:
- `public.user_roles` table with `app_role` enum `('admin', 'user')` and RLS
- `public.has_role(uuid, app_role)` SECURITY DEFINER function (avoids RLS recursion)
- `public.profiles` table with `user_id`, `display_name`, `email`, `avatar_url`
- `handle_new_user()` trigger that auto-creates profiles on signup
- `update_updated_at_column()` trigger function

All other tables have `USING (true) WITH CHECK (true)` RLS policies.

### Complete Table Inventory (30 tables)

**Org-scoped tables** (client gets SELECT via `organisation_id`):
`projects`, `invoices`, `invoice_items`, `deals`, `proposals`, `contracts`, `tasks`, `deliveries`, `time_entries`, `activities`, `contacts`, `forms`, `form_responses`, `portal_messages`, `purchase_orders`, `comments`, `project_updates`, `sessions`, `session_agenda_items`, `project_milestones`

**Admin/team only** (no client access):
`automations`, `automation_logs`, `rate_cards`, `services`, `organisations`, `templates`, `delivery_tasks`

**Special RLS** (keep/adapt existing):
`user_roles` (already has proper RLS), `profiles` (already has proper RLS), `notifications` (user-scoped), `activity_log` (read-only for authenticated), `client_portal_access` (will be replaced by `user_org_access`)

---

## Phase 1: Database Security Layer

### Task 1: Extend Role Enum and User Profiles

**Files:**
- Create: `supabase/migrations/20260312100000_security_phase1_roles.sql`

**Step 1: Write the migration SQL**

This migration extends the existing `app_role` enum to add `team` and `client` roles, adds role and org columns to `profiles`, creates `user_org_access`, and updates `has_role()`. It does NOT drop existing tables.

```sql
-- ==================================================
-- Security Phase 1: Extend roles, add org scoping
-- ==================================================

-- 1. Extend the app_role enum to include team and client
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- 2. Add role and organisation_id to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL;

-- 2b. Add organisation_id to forms table (currently has no org scoping)
-- REVIEWER FIX #2: forms table had no project_id or organisation_id, so client
-- form_responses policies couldn't scope to an org. Adding organisation_id to forms
-- allows proper client scoping: form_responses → forms → organisation_id.
ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL;

-- 3. Create user_org_access table (client -> org mapping, multi-org support)
CREATE TABLE IF NOT EXISTS public.user_org_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organisation_id)
);
ALTER TABLE public.user_org_access ENABLE ROW LEVEL SECURITY;

-- user_org_access RLS: admins/team can manage, clients can read own
CREATE POLICY "admin_team_manage_org_access" ON public.user_org_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'team'));

CREATE POLICY "users_read_own_org_access" ON public.user_org_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Update handle_new_user to set role = 'client' on profiles
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

-- 5. Helper function: check if user has admin or team role (via profiles)
CREATE OR REPLACE FUNCTION public.is_admin_or_team(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('admin', 'team')
  )
$$;

-- 6. Helper function: check if user has org access
CREATE OR REPLACE FUNCTION public.user_has_org_access(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_org_access
    WHERE user_id = _user_id AND organisation_id = _org_id
  )
$$;
```

**Step 2: Verify migration file exists and is syntactically valid**

Run: `cat "supabase/migrations/20260312100000_security_phase1_roles.sql" | head -5`
Expected: The first 5 lines of the migration

**Step 3: Commit**

```bash
git add supabase/migrations/20260312100000_security_phase1_roles.sql
git commit -m "feat(security): extend role enum, add user_org_access table and helper functions"
```

---

### Task 2: Drop All Permissive Policies AND Create Admin/Team Policies (ATOMIC)

> **REVIEWER FIX #1:** Tasks 2 and 3 from the original plan are merged into a single migration.
> Dropping all permissive policies in one migration and recreating proper policies in the next
> would leave a window where every table is wide open. This single migration does both atomically.

**Files:**
- Create: `supabase/migrations/20260312100001_security_phase1_rls_replace.sql`

**Step 1: Write the migration that drops all permissive policies AND recreates proper ones**

This single migration drops every `USING (true)` policy, then immediately creates admin/team full-access policies and public form policies. No security gap.

```sql
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
```

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

-- Notifications: keep user-scoped (already has proper policies, but re-add for safety)
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
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312100001_security_phase1_rls_replace.sql
git commit -m "feat(security): atomic drop-and-replace of all permissive RLS policies with role-based access"
```

---

### Task 3: Create Proper RLS Policies — Client Org-Scoped Read

**Files:**
- Create: `supabase/migrations/20260312100002_security_phase1_rls_client.sql`

**Step 1: Write client read-only, org-scoped policies**

Client users get SELECT only on org-scoped tables, filtered by their `user_org_access` entries. Uses `user_has_org_access()` SECURITY DEFINER function.

```sql
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

-- sessions: scoped by organisation_id (if column exists), else join through project
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
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312100002_security_phase1_rls_client.sql
git commit -m "feat(security): add client org-scoped read-only RLS policies"
```

---

### Task 4: Storage Isolation

> **REVIEWER FIX #3:** Before writing the storage policy, verify actual file paths.
> The policy assumes `documents/{organisation_id}/...`. If the current upload code
> (built by Lovable) stores files without that path structure, every existing file
> becomes inaccessible after this migration.

**Files:**
- Create: `supabase/migrations/20260312100003_security_phase1_storage.sql`

**Step 0 (PREREQUISITE): Check actual storage paths**

Run this in Supabase SQL editor (or via the Supabase client) BEFORE writing the migration:

```sql
SELECT name FROM storage.objects WHERE bucket_id = 'documents' LIMIT 20;
```

**If paths already start with `{org_uuid}/...`:** proceed with Step 1 as written.

**If paths do NOT start with an org UUID:** you must either:
1. Write a data migration to restructure existing files into `{organisation_id}/filename` paths, OR
2. Adapt the storage policy to match the actual path format (and restructure later).

Do NOT skip this check. Applying the policy blindly will lock out all existing files.

**Step 1: Write storage RLS policies**

Replace the blanket `bucket_id = 'documents'` policy with org-scoped access.

```sql
-- ==================================================
-- Security Phase 1: Storage isolation
-- ==================================================

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

-- Client: read-only access to their org's documents
-- Path format: documents/{organisation_id}/...
CREATE POLICY "client_read_own_org_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.user_has_org_access(
      auth.uid(),
      (string_to_array(name, '/'))[1]::uuid
    )
  );
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312100003_security_phase1_storage.sql
git commit -m "feat(security): add org-scoped storage RLS policies"
```

---

### Task 5: Audit Columns

**Files:**
- Create: `supabase/migrations/20260312100004_security_phase1_audit.sql`

**Step 1: Write migration adding audit columns and trigger**

```sql
-- ==================================================
-- Security Phase 1: Audit columns on all core tables
-- ==================================================

-- Auto-set updated_by trigger function
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add updated_by to all core tables that don't have it
-- (updated_at already exists on most tables via the existing trigger)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'projects', 'invoices', 'invoice_items', 'deals', 'proposals',
      'contracts', 'tasks', 'deliveries', 'time_entries', 'activities',
      'contacts', 'forms', 'form_responses', 'portal_messages',
      'purchase_orders', 'comments', 'project_updates', 'sessions',
      'session_agenda_items', 'project_milestones', 'organisations',
      'automations', 'rate_cards', 'services', 'templates'
    ])
  LOOP
    -- Add updated_by column if it doesn't exist
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id)',
      tbl
    );
    -- Create or replace the audit trigger
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_by_%I ON public.%I',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE TRIGGER set_updated_by_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_by()',
      tbl, tbl
    );
  END LOOP;
END $$;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312100004_security_phase1_audit.sql
git commit -m "feat(security): add updated_by audit columns and triggers to all core tables"
```

---

## Phase 2: Auth & Session Hardening

### Task 6: Role-Aware Auth Context

**Files:**
- Modify: `src/hooks/useAuth.tsx`
- Create: `src/types/auth.ts`

**Step 1: Create the auth types file**

```typescript
// src/types/auth.ts
export type AppRole = 'admin' | 'team' | 'client';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: AppRole;
  organisation_id: string | null;
}
```

**Step 2: Rewrite useAuth.tsx with role-aware context**

Replace the entire contents of `src/hooks/useAuth.tsx` with:

```typescript
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile, AppRole } from "@/types/auth";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isTeam: boolean;
  isClient: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isTeam: false,
  isClient: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, email, role, organisation_id")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
    return data as UserProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);

      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        if (mounted) setProfile(prof);
      }

      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);

        if (session?.user) {
          const prof = await fetchProfile(session.user.id);
          if (mounted) setProfile(prof);
        } else {
          setProfile(null);
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    setProfile(null);
    await supabase.auth.signOut();
  };

  const role = profile?.role ?? 'client';

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin: role === 'admin',
        isTeam: role === 'team',
        isClient: role === 'client',
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Step 3: Commit**

```bash
git add src/types/auth.ts src/hooks/useAuth.tsx
git commit -m "feat(auth): add role-aware auth context with profile fetching"
```

---

### Task 7: RequireRole Component

**Files:**
- Create: `src/components/auth/RequireRole.tsx`

**Step 1: Create the RequireRole wrapper component**

```typescript
// src/components/auth/RequireRole.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/types/auth";

interface RequireRoleProps {
  roles: AppRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireRole({ roles, children, redirectTo = "/" }: RequireRoleProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-pulse">
          N
        </div>
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add src/components/auth/RequireRole.tsx
git commit -m "feat(auth): add RequireRole route guard component"
```

---

### Task 8: Add Role Guards to Routes

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add RequireRole imports and wrap admin/team-only routes**

At the top of `src/App.tsx`, add:
```typescript
import { RequireRole } from "@/components/auth/RequireRole";
```

Then wrap admin-only routes:
```typescript
<Route path="/automations" element={<RequireRole roles={['admin', 'team']}><Automations /></RequireRole>} />
<Route path="/rate-cards" element={<RequireRole roles={['admin', 'team']}><RateCards /></RequireRole>} />
<Route path="/services" element={<RequireRole roles={['admin', 'team']}><Services /></RequireRole>} />
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(auth): add RequireRole guards to admin/team-only routes"
```

---

### Task 9: Harden Supabase Client Session Config

**Files:**
- Modify: `src/integrations/supabase/client.ts`

**Step 1: Update the Supabase client config**

Replace the contents of `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'ndg-hub',
    },
  },
});
```

**Step 2: Commit**

```bash
git add src/integrations/supabase/client.ts
git commit -m "feat(auth): harden Supabase client with PKCE flow"
```

> **MANUAL STEP (after Task 9):** Go to Supabase Dashboard → Authentication → Settings
> and set JWT expiry to **3600 seconds** with **refresh token rotation enabled**.
> Task 9 configures the client-side PKCE flow but the server-side session duration
> is a dashboard-only setting that cannot be configured via migrations or client code.

---

## Phase 3: Error Handling & Observability

### Task 10: Create handleSupabaseError Utility

**Files:**
- Create: `src/lib/errors.ts`

**Step 1: Write the error handling utility**

```typescript
// src/lib/errors.ts
import { toast } from "sonner";

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "23505": "This record already exists.",
  "23503": "This record is referenced by other data and cannot be modified.",
  "42501": "You don't have permission to perform this action.",
  "PGRST301": "You don't have permission to access this data.",
  "PGRST116": "The requested record was not found.",
  "23502": "A required field is missing.",
};

export function getErrorMessage(error: SupabaseError): string {
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return "Something went wrong. Please try again.";
}

export function handleSupabaseError(error: SupabaseError, context?: string): void {
  const message = getErrorMessage(error);
  const label = context ? `${context}: ${message}` : message;

  if (import.meta.env.DEV) {
    console.error(`[Supabase Error]`, { context, error });
  }

  toast.error(label);
}
```

**Step 2: Commit**

```bash
git add src/lib/errors.ts
git commit -m "feat(errors): add handleSupabaseError utility with friendly messages"
```

---

### Task 11: Update Data Hooks to Use Error Handling

**Files:**
- Modify: `src/hooks/useProjects.ts` (example — same pattern applies to all hooks)

**Step 1: Update useProjects.ts as the template**

Replace raw `throw error` with `handleSupabaseError`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/lib/errors";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Project = Tables<"projects"> & {
  organisations?: { name: string } | null;
};

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, organisations(name)")
        .order("created_at", { ascending: false });
      if (error) {
        handleSupabaseError(error, "Loading projects");
        return [];
      }
      return data as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*, organisations(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        handleSupabaseError(error, "Loading project");
        return null;
      }
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: TablesInsert<"projects">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (error) => {
      handleSupabaseError(error as any, "Creating project");
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"projects"> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
    },
    onError: (error) => {
      handleSupabaseError(error as any, "Updating project");
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (error) => {
      handleSupabaseError(error as any, "Deleting project");
    },
  });
}
```

**Step 2: Apply the same pattern to all other data hooks**

The following hooks need the same treatment (import `handleSupabaseError`, replace raw throws in queries, add `onError` to mutations, add success toasts):
- `useInvoices.ts`
- `useContacts.ts`
- `useDeals.ts`
- `useTasks.ts`
- `useSessions.ts`
- `useContracts.ts`
- `useProposals.ts`
- `useDeliveries.ts`
- `useTimeEntries.ts`
- `useActivities.ts`
- `useForms.ts`
- `useFormResponses.ts`
- `usePortalMessages.ts`
- `usePurchaseOrders.ts`
- `useRateCards.ts`
- `useServices.ts`
- `useOrganisations.ts`
- `useProjectUpdates.ts`
- `useProjectMilestones.ts`
- `useSessionAgenda.ts`
- `useAutomations.ts`
- `useInvoiceItems.ts`
- `useActivityLog.ts`
- `useEntityDocuments.ts`
- `useEntityLinks.ts`
- `useProjectNotes.ts`
- `useReportingData.ts`
- `useDashboardStats.ts`
- `useUpdateContact.ts`
- `useUpdateInvoice.ts`
- `useUpdateOrganisation.ts`

**Step 3: Commit after each batch of ~5 hooks**

```bash
git add src/hooks/useProjects.ts src/hooks/useInvoices.ts src/hooks/useContacts.ts src/hooks/useDeals.ts src/hooks/useTasks.ts
git commit -m "feat(errors): add error handling to project, invoice, contact, deal, and task hooks"
```

Continue in batches until all hooks are updated.

---

### Task 12: Console Cleanup

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add esbuild console drop for production**

In `vite.config.ts`, add the `esbuild` option:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
}));
```

Note: This also removes the `lovable-tagger` plugin (Task 15 dependency audit).

**Step 2: Commit**

```bash
git add vite.config.ts
git commit -m "feat(build): strip console/debugger in production, remove lovable-tagger"
```

---

## Phase 4: Codebase Cleanup

### Task 13: Environment Validation

**Files:**
- Modify: `src/main.tsx`

**Step 1: Add env var validation before app mount**

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Fail fast if required env vars are missing
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  const value = import.meta.env[envVar];
  if (!value || typeof value !== 'string' || value.trim() === '') {
    const root = document.getElementById("root")!;
    const div = document.createElement("div");
    div.style.cssText = "padding:2rem;font-family:system-ui;color:#dc2626";
    const h1 = document.createElement("h1");
    h1.textContent = "Configuration Error";
    const p1 = document.createElement("p");
    p1.textContent = `Missing required environment variable: ${envVar}`;
    const p2 = document.createElement("p");
    p2.textContent = "Check your .env file.";
    div.append(h1, p1, p2);
    root.replaceChildren(div);
    throw new Error(`Missing required env var: ${envVar}`);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
```

**Step 2: Commit**

```bash
git add src/main.tsx
git commit -m "feat(config): add startup env var validation"
```

---

### Task 14: Dependency Audit

**Step 1: Run npm audit**

Run: `npm audit`
Expected: List of vulnerabilities (if any)

**Step 2: Fix vulnerabilities**

Run: `npm audit fix`
Expected: Fixed N vulnerabilities

**Step 3: Remove lovable-tagger**

Run: `npm uninstall lovable-tagger`
Expected: Removed lovable-tagger from devDependencies

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): audit fix and remove lovable-tagger"
```

---

### Task 15: CORS Lockdown on Edge Functions

**Files:**
- Modify all 7 edge functions:
  - `supabase/functions/ai-assistant/index.ts`
  - `supabase/functions/check-overdue-invoices/index.ts`
  - `supabase/functions/generate-invoice-pdf/index.ts`
  - `supabase/functions/send-invoice-email/index.ts`
  - `supabase/functions/sync-clarify/index.ts`
  - `supabase/functions/sync-gmail/index.ts`
  - `supabase/functions/weekly-digest/index.ts`

**Step 1: Create shared CORS config**

Create `supabase/functions/_shared/cors.ts`:

```typescript
const ALLOWED_ORIGINS = [
  Deno.env.get("ALLOWED_ORIGIN") || "https://ndghub.lovable.app",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
```

**Step 2: Update each edge function**

In each function, replace:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  ...
};
```

With:
```typescript
import { getCorsHeaders } from "../_shared/cors.ts";
```

And change all `corsHeaders` usages to `getCorsHeaders(req)`.

**Step 3: Commit**

```bash
git add supabase/functions/
git commit -m "feat(security): lock down CORS on all edge functions to production origin"
```

---

### Task 16: Update Supabase Types

After all migrations are written, regenerate the Supabase types to include the new columns and tables.

**Step 1: Regenerate types**

Run: `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`

If local Supabase is not running, this can be done after pushing migrations. Mark as a follow-up if needed.

**Step 2: Commit if types changed**

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore: regenerate Supabase types after security migrations"
```

---

## Rollback Plan

If any migration breaks the app, run this emergency rollback migration to restore permissive access while you debug:

```sql
-- EMERGENCY ROLLBACK: Re-apply permissive policies to restore access
-- File: supabase/migrations/YYYYMMDDHHMMSS_emergency_rollback.sql
-- WARNING: This removes all security. Use only in emergencies.

-- Re-enable permissive access on all tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'organisations','contacts','deals','projects','tasks','sessions',
    'invoices','invoice_items','comments','activity_log','deliveries',
    'delivery_tasks','templates','time_entries','proposals','contracts',
    'services','rate_cards','purchase_orders','forms','activities',
    'client_portal_access','project_milestones','project_updates',
    'form_responses','portal_messages','session_agenda_items',
    'automations','automation_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format(
      'CREATE POLICY "emergency_permissive_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;
```

Keep this file ready but do NOT apply it unless the app is broken. After debugging, remove it and re-apply the proper migrations.

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] No table has a `USING (true)` RLS policy — `grep -r "USING (true)" supabase/migrations/` should only match dropped policies
- [ ] `user_org_access` table exists with proper RLS
- [ ] `is_admin_or_team()` and `user_has_org_access()` functions exist
- [ ] `profiles` table has `role` and `organisation_id` columns
- [ ] `forms` table has `organisation_id` column (added for client scoping)
- [ ] `useAuth` returns `profile`, `isAdmin`, `isTeam`, `isClient`
- [ ] `RequireRole` component exists and is used on admin routes
- [ ] `handleSupabaseError` is used in all data hooks
- [ ] `vite.config.ts` drops console in production
- [ ] `main.tsx` validates env vars
- [ ] All edge functions use locked-down CORS
- [ ] `npm audit` returns 0 critical/high vulnerabilities
- [ ] `updated_by` column exists on all core tables
