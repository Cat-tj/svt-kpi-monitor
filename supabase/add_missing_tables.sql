-- Entry Comments table
CREATE TABLE IF NOT EXISTS entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES kpi_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE entry_comments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "comments_read" ON entry_comments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "comments_insert" ON entry_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_entry_comments_entry ON entry_comments(entry_id, created_at);

-- Seed templates if table is empty
INSERT INTO kpi_templates (name, description, category, kpi_data)
SELECT 'Engineering Team', 'Standard KPIs for software engineering teams', 'Engineering', '[{"name":"Sprint Velocity","type":"numerical","timeframe":"weekly","target_value":50,"unit":"points","weight":20},{"name":"Code Review Turnaround","type":"numerical","timeframe":"weekly","target_value":24,"unit":"hours","weight":15},{"name":"Bug Resolution Rate","type":"percentage","timeframe":"monthly","target_value":90,"unit":"%","weight":20}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM kpi_templates LIMIT 1);

INSERT INTO kpi_templates (name, description, category, kpi_data)
SELECT 'Sales Team', 'Standard KPIs for sales teams', 'Sales', '[{"name":"Monthly Revenue","type":"currency","timeframe":"monthly","target_value":1000000000,"unit":"IDR","weight":30},{"name":"Lead Conversion","type":"percentage","timeframe":"monthly","target_value":25,"unit":"%","weight":25},{"name":"New Clients","type":"numerical","timeframe":"monthly","target_value":10,"unit":"clients","weight":20}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM kpi_templates WHERE name = 'Sales Team');

INSERT INTO kpi_templates (name, description, category, kpi_data)
SELECT 'Operations', 'Standard KPIs for operations', 'Operations', '[{"name":"SLA Compliance","type":"percentage","timeframe":"monthly","target_value":99,"unit":"%","weight":30},{"name":"Response Time","type":"numerical","timeframe":"weekly","target_value":4,"unit":"hours","weight":25},{"name":"Customer Satisfaction","type":"percentage","timeframe":"monthly","target_value":90,"unit":"%","weight":25}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM kpi_templates WHERE name = 'Operations');
