
-- Workshop columns on deals
ALTER TABLE public.deals ADD COLUMN workshops_aware integer DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN workshops_champion integer DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN workshops_manager integer DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN workshops_leader integer DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN workshops_bespoke integer DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN bespoke_details jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.deals ADD COLUMN total_workshops integer GENERATED ALWAYS AS (workshops_aware + workshops_champion + workshops_manager + workshops_leader + workshops_bespoke) STORED;
ALTER TABLE public.deals ADD COLUMN package_size text GENERATED ALWAYS AS (
  CASE
    WHEN (workshops_aware + workshops_champion + workshops_manager + workshops_leader + workshops_bespoke) <= 2 THEN 'small'
    WHEN (workshops_aware + workshops_champion + workshops_manager + workshops_leader + workshops_bespoke) <= 10 THEN 'medium'
    ELSE 'large'
  END
) STORED;

-- Activities table for CRM-style tracking
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'note',
  subject text,
  body text,
  source text DEFAULT 'manual',
  activity_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD activities"
  ON public.activities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add package_size to templates
ALTER TABLE public.templates ADD COLUMN package_size text DEFAULT 'small';

-- Update handle_deal_won trigger to use package_size
CREATE OR REPLACE FUNCTION public.handle_deal_won()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_delivery_id UUID;
  v_template RECORD;
  v_task RECORD;
  v_pkg_size text;
  v_workshop_count integer;
BEGIN
  IF NEW.stage = 'won' AND (OLD.stage IS NULL OR OLD.stage <> 'won') THEN
    -- Calculate package size
    v_workshop_count := COALESCE(NEW.workshops_aware, 0) + COALESCE(NEW.workshops_champion, 0) + COALESCE(NEW.workshops_manager, 0) + COALESCE(NEW.workshops_leader, 0) + COALESCE(NEW.workshops_bespoke, 0);
    IF v_workshop_count <= 2 THEN v_pkg_size := 'small';
    ELSIF v_workshop_count <= 10 THEN v_pkg_size := 'medium';
    ELSE v_pkg_size := 'large';
    END IF;

    -- Create delivery record
    INSERT INTO public.deliveries (deal_id, organisation_id, title, service_type, status)
    VALUES (NEW.id, NEW.organisation_id, NEW.title, NEW.service_type, 'planning')
    RETURNING id INTO v_delivery_id;

    -- Find matching template by service_type AND package_size
    SELECT * INTO v_template FROM public.templates
    WHERE service_type = NEW.service_type AND package_size = v_pkg_size
    LIMIT 1;

    -- Fallback: try just service_type
    IF v_template.id IS NULL THEN
      SELECT * INTO v_template FROM public.templates
      WHERE service_type = NEW.service_type
      LIMIT 1;
    END IF;

    IF v_template.id IS NOT NULL THEN
      FOR v_task IN SELECT * FROM jsonb_array_elements(v_template.tasks_json)
      LOOP
        INSERT INTO public.delivery_tasks (delivery_id, title, assignee, due_date, sort_order)
        VALUES (
          v_delivery_id,
          v_task.value->>'title',
          v_task.value->>'assignee',
          CURRENT_DATE + (v_task.value->>'relative_due_days')::int,
          COALESCE((v_task.value->>'sort_order')::int, 0)
        );
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_deal_won ON public.deals;
CREATE TRIGGER on_deal_won
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deal_won();
