-- First, create a department so we can assign users
INSERT INTO departments (id, name, description)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'Engineering', 'Software development and infrastructure')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (id, name, description)
VALUES ('a1b2c3d4-0000-0000-0000-000000000002', 'Sales & Marketing', 'Revenue generation and brand management')
ON CONFLICT (name) DO NOTHING;
