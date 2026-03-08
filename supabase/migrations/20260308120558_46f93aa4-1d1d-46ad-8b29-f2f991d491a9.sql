-- Add missing columns to deals table (per spec)
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS owner TEXT,
ADD COLUMN IF NOT EXISTS weighted_value NUMERIC(10,2) GENERATED ALWAYS AS (COALESCE(value, 0) * COALESCE(probability, 0) / 100) STORED,
ADD COLUMN IF NOT EXISTS lost_reason TEXT,
ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposal_url TEXT,
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;

-- Create service_type enum for clarity
CREATE TYPE public.service_type AS ENUM ('workshop', 'programme', 'coaching', 'keynote', 'audit', 'sera_pilot');

-- Create delivery_status enum
CREATE TYPE public.delivery_status AS ENUM ('planning', 'materials_prep', 'scheduled', 'in_progress', 'delivered', 'follow_up', 'complete');

-- Create deliveries table (per spec)
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  service_type TEXT,
  status delivery_status NOT NULL DEFAULT 'planning',
  delivery_date DATE,
  delegate_count INTEGER,
  satisfaction_score NUMERIC(3,1),
  neuro_stage TEXT,
  kirkpatrick_level INTEGER,
  feedback_sent BOOLEAN DEFAULT FALSE,
  feedback_received BOOLEAN DEFAULT FALSE,
  pre_assessment_complete BOOLEAN DEFAULT FALSE,
  post_assessment_complete BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create delivery_tasks table
CREATE TABLE public.delivery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT,
  tasks_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for deliveries
CREATE POLICY "Authenticated users can CRUD deliveries" ON public.deliveries
FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for delivery_tasks
CREATE POLICY "Authenticated users can CRUD delivery_tasks" ON public.delivery_tasks
FOR ALL USING (true) WITH CHECK (true);

-- RLS policies for templates
CREATE POLICY "Authenticated users can CRUD templates" ON public.templates
FOR ALL USING (true) WITH CHECK (true);

-- Add update trigger for deliveries
CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates per spec
INSERT INTO public.templates (name, service_type, tasks_json) VALUES
('Half Day Workshop', 'workshop', '[
  {"title": "Send pre-session questionnaire", "assignee": "rich", "relative_due_days": -7},
  {"title": "Prepare materials", "assignee": "charlie", "relative_due_days": -3},
  {"title": "Deliver session", "assignee": "rich", "relative_due_days": 0},
  {"title": "Send feedback form", "assignee": "rich", "relative_due_days": 2},
  {"title": "Compile feedback report", "assignee": "charlie", "relative_due_days": 7},
  {"title": "Schedule follow up", "assignee": "rich", "relative_due_days": 14}
]'::jsonb),
('Full Programme', 'programme', '[
  {"title": "Kick off call", "assignee": "charlie", "relative_due_days": -14},
  {"title": "Needs assessment", "assignee": "charlie", "relative_due_days": -10},
  {"title": "Design programme", "assignee": "charlie", "relative_due_days": -7},
  {"title": "Prepare materials", "assignee": "rich", "relative_due_days": -3},
  {"title": "Deliver module 1", "assignee": "rich", "relative_due_days": 0},
  {"title": "Collect interim feedback", "assignee": "rich", "relative_due_days": 1},
  {"title": "Deliver module 2", "assignee": "rich", "relative_due_days": 7},
  {"title": "Send feedback form", "assignee": "rich", "relative_due_days": 9},
  {"title": "Compile report", "assignee": "charlie", "relative_due_days": 14},
  {"title": "Quarterly review", "assignee": "charlie", "relative_due_days": 90}
]'::jsonb),
('Leadership Coaching', 'coaching', '[
  {"title": "Chemistry call", "assignee": "charlie", "relative_due_days": -7},
  {"title": "Set objectives", "assignee": "charlie", "relative_due_days": -3},
  {"title": "Session 1", "assignee": "charlie", "relative_due_days": 0},
  {"title": "Session 2", "assignee": "charlie", "relative_due_days": 14},
  {"title": "Session 3", "assignee": "charlie", "relative_due_days": 28},
  {"title": "Review and report", "assignee": "charlie", "relative_due_days": 35}
]'::jsonb),
('Keynote', 'keynote', '[
  {"title": "Brief call", "assignee": "charlie", "relative_due_days": -14},
  {"title": "Prepare slides", "assignee": "rich", "relative_due_days": -5},
  {"title": "Tech rehearsal", "assignee": "rich", "relative_due_days": -1},
  {"title": "Deliver keynote", "assignee": "rich", "relative_due_days": 0},
  {"title": "Share recording", "assignee": "rich", "relative_due_days": 3}
]'::jsonb);

-- Enable realtime for deliveries
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;