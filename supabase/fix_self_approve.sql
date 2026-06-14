-- Prevent staff from self-approving their own entries
-- The WITH CHECK must ensure the entry stays 'pending' after staff edits it

DROP POLICY IF EXISTS "entries_update_own" ON kpi_entries;

CREATE POLICY "entries_update_own" ON kpi_entries
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid() AND status = 'pending');
