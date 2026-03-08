
-- Project milestones table
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD project_milestones"
  ON public.project_milestones FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);

-- Trigger function to auto-seed milestones when a project is created
CREATE OR REPLACE FUNCTION public.seed_project_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_milestones (project_id, milestone_key, label, sort_order)
  VALUES
    (NEW.id, 'contract_signed',      'Contract signed',       1),
    (NEW.id, 'po_received',          'PO received',           2),
    (NEW.id, 'project_plan_agreed',  'Project plan agreed',   3),
    (NEW.id, 'prep_meeting_booked',  'Prep meeting booked',   4),
    (NEW.id, 'prep_meeting_done',    'Prep meeting done',     5),
    (NEW.id, 'content_built',        'Content built',         6),
    (NEW.id, 'content_scheduled',    'Content scheduled',     7),
    (NEW.id, 'delivery_scheduled',   'Delivery scheduled',    8),
    (NEW.id, 'logistics_confirmed',  'Logistics confirmed',   9),
    (NEW.id, 'pre_assessment_sent',  'Pre-assessment sent',  10),
    (NEW.id, 'delivery_complete',    'Delivery complete',    11),
    (NEW.id, 'post_assessment_sent', 'Post-assessment sent', 12),
    (NEW.id, 'feedback_received',    'Feedback received',    13),
    (NEW.id, 'invoice_sent',         'Invoice sent',         14);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created_seed_milestones
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_project_milestones();
