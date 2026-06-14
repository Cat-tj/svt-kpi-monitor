-- =============================================================================
-- NEW TABLES for additional features
-- =============================================================================

-- Announcements (admin posts company-wide messages)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_read" ON announcements
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "announcements_admin" ON announcements
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- KPI Templates (predefined KPI sets)
CREATE TABLE IF NOT EXISTS kpi_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kpi_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_read" ON kpi_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "templates_manage" ON kpi_templates
  FOR ALL TO authenticated
  USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');

-- Activity Log (audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details TEXT,
  entity_type TEXT, -- 'kpi_entry', 'kpi', 'profile', 'department'
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_read_admin" ON activity_log
  FOR SELECT TO authenticated
  USING (auth_user_role() = 'admin');

CREATE POLICY "activity_read_own" ON activity_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "activity_insert" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Entry Comments
CREATE TABLE IF NOT EXISTS entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES kpi_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE entry_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_read" ON entry_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert" ON entry_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entry_comments_entry ON entry_comments(entry_id, created_at);

-- Seed some default KPI templates
INSERT INTO kpi_templates (name, description, category, kpis) VALUES
  ('Engineering Team', 'Standard KPIs for software engineering teams', 'Engineering', '[{"name":"Sprint Velocity","type":"numerical","timeframe":"weekly","target_value":50,"unit":"points","weight":20},{"name":"Code Review Turnaround","type":"numerical","timeframe":"weekly","target_value":24,"unit":"hours","weight":15},{"name":"Bug Resolution Rate","type":"percentage","timeframe":"monthly","target_value":90,"unit":"%","weight":20},{"name":"Test Coverage","type":"percentage","timeframe":"monthly","target_value":80,"unit":"%","weight":15}]'::jsonb),
  ('Sales Team', 'Standard KPIs for sales and business development', 'Sales', '[{"name":"Monthly Revenue","type":"currency","timeframe":"monthly","target_value":1000000000,"unit":"IDR","weight":30},{"name":"Lead Conversion Rate","type":"percentage","timeframe":"monthly","target_value":25,"unit":"%","weight":25},{"name":"New Clients","type":"numerical","timeframe":"monthly","target_value":10,"unit":"clients","weight":20},{"name":"Client Retention","type":"percentage","timeframe":"monthly","target_value":90,"unit":"%","weight":25}]'::jsonb),
  ('Operations', 'Standard KPIs for operations and support', 'Operations', '[{"name":"SLA Compliance","type":"percentage","timeframe":"monthly","target_value":99,"unit":"%","weight":30},{"name":"Average Response Time","type":"numerical","timeframe":"weekly","target_value":4,"unit":"hours","weight":25},{"name":"Ticket Resolution Rate","type":"percentage","timeframe":"monthly","target_value":95,"unit":"%","weight":25},{"name":"Customer Satisfaction","type":"percentage","timeframe":"monthly","target_value":90,"unit":"%","weight":20}]'::jsonb),
  ('HR & Admin', 'Standard KPIs for human resources', 'HR', '[{"name":"Employee Retention","type":"percentage","timeframe":"annually","target_value":90,"unit":"%","weight":30},{"name":"Time to Hire","type":"numerical","timeframe":"monthly","target_value":30,"unit":"days","weight":20},{"name":"Training Completion","type":"percentage","timeframe":"monthly","target_value":85,"unit":"%","weight":25},{"name":"Employee Satisfaction","type":"percentage","timeframe":"annually","target_value":80,"unit":"%","weight":25}]'::jsonb)
ON CONFLICT DO NOTHING;
