ALTER TABLE public.celebration_presentations
  ADD COLUMN IF NOT EXISTS offline_r2_storage_key text,
  ADD COLUMN IF NOT EXISTS offline_r2_content_hash text,
  ADD COLUMN IF NOT EXISTS offline_r2_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS offline_r2_stored_at timestamptz;

COMMENT ON COLUMN public.celebration_presentations.offline_r2_storage_key
  IS 'Private R2 object key for the completed offline MP4.';

COMMENT ON COLUMN public.celebration_presentations.offline_r2_content_hash
  IS 'Presentation content hash used to validate the stored MP4.';
