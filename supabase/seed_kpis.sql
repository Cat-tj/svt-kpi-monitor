-- Seed KPIs for Engineering department
INSERT INTO kpis (name, description, department_id, type, timeframe, target_value, weight, unit)
VALUES
  ('Sprint Velocity', 'Story points completed per sprint', 'a1b2c3d4-0000-0000-0000-000000000001', 'numerical', 'weekly', 50, 20, 'points'),
  ('Code Review Turnaround', 'Average time to complete code reviews', 'a1b2c3d4-0000-0000-0000-000000000001', 'numerical', 'weekly', 24, 15, 'hours'),
  ('Bug Resolution Rate', 'Percentage of bugs resolved within SLA', 'a1b2c3d4-0000-0000-0000-000000000001', 'percentage', 'monthly', 90, 20, '%'),
  ('Documentation Coverage', 'Percentage of features with complete docs', 'a1b2c3d4-0000-0000-0000-000000000001', 'percentage', 'monthly', 80, 10, '%')
ON CONFLICT DO NOTHING;

-- Seed KPIs for Sales department
INSERT INTO kpis (name, description, department_id, type, timeframe, target_value, weight, unit)
VALUES
  ('Monthly Revenue', 'Total revenue generated', 'a1b2c3d4-0000-0000-0000-000000000002', 'currency', 'monthly', 3000000000, 30, 'IDR'),
  ('Lead Conversion Rate', 'Percentage of leads converted to customers', 'a1b2c3d4-0000-0000-0000-000000000002', 'percentage', 'monthly', 30, 25, '%')
ON CONFLICT DO NOTHING;
