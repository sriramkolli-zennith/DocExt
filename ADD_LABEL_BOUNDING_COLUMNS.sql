-- Adds columns to store label bounding metadata for highlighting field names alongside values
ALTER TABLE public.document_fields
  ADD COLUMN IF NOT EXISTS label_page_number integer,
  ADD COLUMN IF NOT EXISTS label_bounding_box jsonb;
