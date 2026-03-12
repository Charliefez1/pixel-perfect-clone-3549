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
