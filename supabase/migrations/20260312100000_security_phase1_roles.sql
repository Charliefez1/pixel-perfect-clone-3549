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
