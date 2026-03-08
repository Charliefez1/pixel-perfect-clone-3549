-- Step 4: Client portal access table and tightened RLS

CREATE TABLE public.client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organisation_id)
);
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage portal access"
  ON public.client_portal_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own portal access"
  ON public.client_portal_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function
CREATE OR REPLACE FUNCTION public.can_access_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'admin') 
    OR EXISTS (
      SELECT 1 FROM public.client_portal_access 
      WHERE user_id = _user_id AND organisation_id = _org_id
    )
$$;

-- Tighten deliveries RLS
DROP POLICY IF EXISTS "Authenticated users can CRUD deliveries" ON public.deliveries;
CREATE POLICY "Admins full access to deliveries" ON public.deliveries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Portal users view own org deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (public.can_access_org(auth.uid(), organisation_id));

-- Tighten invoices RLS
DROP POLICY IF EXISTS "Authenticated users can CRUD invoices" ON public.invoices;
CREATE POLICY "Admins full access to invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Portal users view own org invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.can_access_org(auth.uid(), organisation_id));

-- Tighten activities RLS
DROP POLICY IF EXISTS "Authenticated users can CRUD activities" ON public.activities;
CREATE POLICY "Admins full access to activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Portal users view own org activities" ON public.activities
  FOR SELECT TO authenticated
  USING (public.can_access_org(auth.uid(), organisation_id));