-- Create storage bucket for KPI evidence/attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kpi-evidence',
  'kpi-evidence',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Storage policies: authenticated users can upload, everyone can read (bucket is public)
DO $$ BEGIN
  CREATE POLICY "evidence_upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'kpi-evidence');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "evidence_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'kpi-evidence');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "evidence_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'kpi-evidence' AND owner = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL; END $$;
