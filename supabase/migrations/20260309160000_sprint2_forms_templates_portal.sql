-- Sprint 2: Forms, Templates, Portal & Hierarchy

-- Phase A: Subtask hierarchy
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Phase B.2: Form responses table
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  respondent_name TEXT,
  respondent_email TEXT,
  answers JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read responses" ON form_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert responses" ON form_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone authenticated can insert responses" ON form_responses FOR INSERT TO authenticated WITH CHECK (true);

-- Increment form responses count helper
CREATE OR REPLACE FUNCTION increment_form_responses(form_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forms SET responses_count = COALESCE(responses_count, 0) + 1 WHERE id = form_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase C: Enhance templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'project';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS variables JSONB;

-- Phase D: Portal messages table
CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'team')),
  sender_name TEXT,
  sender_email TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read portal messages" ON portal_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert portal messages" ON portal_messages FOR INSERT TO authenticated WITH CHECK (true);
