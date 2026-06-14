-- =============================================================================
-- SCHEMA V2 - Additional tables for new features
-- =============================================================================

-- Activity/Audit Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'entry_submitted', 'entry_approved', 'kpi_created', etc.
  target_type TEXT, -- 'kpi_entry', 'kpi', 'profile', 'department'
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comments on KPI entries
CREATE TABLE IF NOT EXISTS entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES kpi_entries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- File attachments (metadata, actual files in Supabase Storage)
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES kpi_entries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- KPI Templates (pre-built sets)
CREATE TABLE IF NOT EXISTS kpi_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'engineering', 'sales', 'hr', 'finance', 'operations'
  kpi_data JSONB NOT NULL, -- array of KPI definitions
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'normal', 'important', 'critical'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- User preferences (dashboard config, language, theme, pinned KPIs)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light', -- 'light', 'dark', 'system'
  language TEXT DEFAULT 'en', -- 'en', 'id'
  pinned_kpis UUID[] DEFAULT '{}',
  dashboard_widgets JSONB DEFAULT '["stats","pending","recent"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delegation (approval delegation)
CREATE TABLE IF NOT EXISTS delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES profiles(id),
  delegate_id UUID NOT NULL REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- KPI period targets (different targets per period)
CREATE TABLE IF NOT EXISTS kpi_period_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kpi_id, period_start, period_end)
);

-- Add assigned_to column to KPIs for ownership
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Add parent_kpi_id for cascading
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS parent_kpi_id UUID REFERENCES kpis(id);

-- Add revision fields to kpi_entries
ALTER TABLE kpi_entries ADD COLUMN IF NOT EXISTS revision_requested BOOLEAN DEFAULT false;
ALTER TABLE kpi_entries ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- Export log
CREATE TABLE IF NOT EXISTS export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  export_type TEXT NOT NULL, -- 'csv', 'excel', 'pdf'
  filters JSONB,
  record_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS for new tables
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_period_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_log ENABLE ROW LEVEL SECURITY;

-- Activity log: admins see all, others see own
CREATE POLICY "activity_log_admin" ON activity_log FOR SELECT TO authenticated
  USING (auth_user_role() = 'admin');
CREATE POLICY "activity_log_own" ON activity_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comments: anyone can read comments on entries they can see, anyone can write
CREATE POLICY "comments_read" ON entry_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON entry_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Attachments: same as entries access
CREATE POLICY "attachments_read" ON attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "attachments_insert" ON attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Templates: everyone can read, admin can manage
CREATE POLICY "templates_read" ON kpi_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_admin" ON kpi_templates FOR ALL TO authenticated
  USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- Announcements: everyone reads active, admin manages
CREATE POLICY "announcements_read" ON announcements FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "announcements_admin" ON announcements FOR ALL TO authenticated
  USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- Preferences: own only
CREATE POLICY "prefs_own" ON user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Delegations: involved parties + admin
CREATE POLICY "delegations_own" ON delegations FOR ALL TO authenticated
  USING (delegator_id = auth.uid() OR delegate_id = auth.uid());
CREATE POLICY "delegations_admin" ON delegations FOR ALL TO authenticated
  USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- Period targets: same as KPIs
CREATE POLICY "period_targets_read" ON kpi_period_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "period_targets_admin" ON kpi_period_targets FOR ALL TO authenticated
  USING (auth_user_role() = 'admin') WITH CHECK (auth_user_role() = 'admin');

-- Export log: own + admin
CREATE POLICY "export_log_own" ON export_log FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "export_log_admin" ON export_log FOR SELECT TO authenticated
  USING (auth_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entry_comments_entry ON entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_attachments_entry ON attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delegations_active ON delegations(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_kpi_period_targets_kpi ON kpi_period_targets(kpi_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Seed KPI Templates
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO kpi_templates (name, description, category, kpi_data) VALUES
('Engineering Team Starter', 'Common KPIs for software engineering teams', 'engineering',
 '[{"name":"Sprint Velocity","type":"numerical","timeframe":"weekly","target_value":50,"unit":"points","weight":20},{"name":"Code Review Turnaround","type":"numerical","timeframe":"weekly","target_value":24,"unit":"hours","weight":15},{"name":"Bug Resolution Rate","type":"percentage","timeframe":"monthly","target_value":90,"unit":"%","weight":20},{"name":"Test Coverage","type":"percentage","timeframe":"monthly","target_value":80,"unit":"%","weight":15},{"name":"Deployment Frequency","type":"numerical","timeframe":"weekly","target_value":3,"unit":"deploys","weight":10}]'::jsonb),

('Sales & Marketing', 'Revenue and conversion focused KPIs', 'sales',
 '[{"name":"Monthly Revenue","type":"currency","timeframe":"monthly","target_value":3000000000,"unit":"IDR","weight":30},{"name":"Lead Conversion Rate","type":"percentage","timeframe":"monthly","target_value":30,"unit":"%","weight":25},{"name":"Customer Acquisition Cost","type":"currency","timeframe":"monthly","target_value":500000,"unit":"IDR","weight":15},{"name":"Pipeline Value","type":"currency","timeframe":"monthly","target_value":10000000000,"unit":"IDR","weight":20}]'::jsonb),

('HR & People', 'Employee satisfaction and retention metrics', 'hr',
 '[{"name":"Employee Retention Rate","type":"percentage","timeframe":"annually","target_value":90,"unit":"%","weight":25},{"name":"Time to Hire","type":"numerical","timeframe":"monthly","target_value":30,"unit":"days","weight":20},{"name":"Training Hours per Employee","type":"numerical","timeframe":"monthly","target_value":8,"unit":"hours","weight":15},{"name":"Employee Satisfaction Score","type":"percentage","timeframe":"monthly","target_value":85,"unit":"%","weight":25}]'::jsonb),

('Finance', 'Financial health and efficiency metrics', 'finance',
 '[{"name":"Operating Margin","type":"percentage","timeframe":"monthly","target_value":20,"unit":"%","weight":25},{"name":"Cost Reduction","type":"percentage","timeframe":"annually","target_value":15,"unit":"%","weight":20},{"name":"Invoice Processing Time","type":"numerical","timeframe":"monthly","target_value":3,"unit":"days","weight":15},{"name":"Budget Variance","type":"percentage","timeframe":"monthly","target_value":5,"unit":"%","weight":20}]'::jsonb),

('Operations', 'Service delivery and efficiency metrics', 'operations',
 '[{"name":"SLA Compliance","type":"percentage","timeframe":"monthly","target_value":99,"unit":"%","weight":25},{"name":"Average Response Time","type":"numerical","timeframe":"weekly","target_value":4,"unit":"hours","weight":20},{"name":"Customer Satisfaction","type":"percentage","timeframe":"monthly","target_value":95,"unit":"%","weight":25},{"name":"Process Efficiency","type":"percentage","timeframe":"monthly","target_value":85,"unit":"%","weight":15}]'::jsonb)
ON CONFLICT DO NOTHING;
