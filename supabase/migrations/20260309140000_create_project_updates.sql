CREATE TABLE project_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project updates"
  ON project_updates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert project updates"
  ON project_updates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update project updates"
  ON project_updates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete project updates"
  ON project_updates FOR DELETE TO authenticated USING (true);
