-- Create a function that auto-creates delivery + tasks when a deal is marked as won
CREATE OR REPLACE FUNCTION public.handle_deal_won()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivery_id UUID;
  v_template RECORD;
  v_task RECORD;
BEGIN
  -- Only fire when stage changes TO 'won'
  IF NEW.stage = 'won' AND (OLD.stage IS NULL OR OLD.stage <> 'won') THEN
    -- Create delivery record
    INSERT INTO public.deliveries (deal_id, organisation_id, title, service_type, status)
    VALUES (NEW.id, NEW.organisation_id, NEW.title, NEW.service_type, 'planning')
    RETURNING id INTO v_delivery_id;

    -- Find matching template by service_type
    SELECT * INTO v_template FROM public.templates
    WHERE service_type = NEW.service_type
    LIMIT 1;

    -- If template found, create tasks from it
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
$$;

-- Create trigger on deals table
CREATE TRIGGER trigger_deal_won
AFTER UPDATE OF stage ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.handle_deal_won();