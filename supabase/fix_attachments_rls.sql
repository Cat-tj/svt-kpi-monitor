-- Ensure attachments table has proper RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing to recreate cleanly
DROP POLICY IF EXISTS "attachments_insert" ON attachments;
DROP POLICY IF EXISTS "attachments_read" ON attachments;
DROP POLICY IF EXISTS "attachments_read_own" ON attachments;
DROP POLICY IF EXISTS "attachments_admin" ON attachments;

-- Uploader can insert their own attachments
CREATE POLICY "attachments_insert" ON attachments
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Anyone authenticated can read attachments (managers/admins need to see evidence)
CREATE POLICY "attachments_read" ON attachments
  FOR SELECT TO authenticated
  USING (true);

-- Uploader or admin can delete
CREATE POLICY "attachments_delete" ON attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR auth_user_role() = 'admin');
