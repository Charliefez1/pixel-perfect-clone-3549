-- Sprint 4: Session agenda items + Automations engine

-- Session agenda items (timed activity blocks for workshops)
CREATE TABLE IF NOT EXISTS session_agenda_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  position INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'activity', -- activity, break, intro, debrief, energiser
  method TEXT, -- e.g. "Think-Pair-Share", "Gallery Walk"
  materials TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE session_agenda_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage agenda items" ON session_agenda_items FOR ALL USING (true) WITH CHECK (true);

-- Automations table (if/then rules)
CREATE TABLE IF NOT EXISTS automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  trigger_entity TEXT NOT NULL, -- project, delivery, task, invoice
  trigger_event TEXT NOT NULL, -- status_change, field_change, created, date_reached
  trigger_conditions JSONB DEFAULT '{}', -- e.g. {"from": "planning", "to": "in_progress"}
  action_type TEXT NOT NULL, -- update_field, create_task, send_notification, log_activity
  action_config JSONB DEFAULT '{}', -- e.g. {"field": "neuro_phase", "value": "engage"}
  created_by UUID REFERENCES auth.users(id),
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage automations" ON automations FOR ALL USING (true) WITH CHECK (true);

-- Automation log (history of rule executions)
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action_taken TEXT NOT NULL,
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view automation logs" ON automation_logs FOR ALL USING (true) WITH CHECK (true);
