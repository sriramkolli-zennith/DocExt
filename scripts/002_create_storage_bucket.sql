-- Create storage bucket for documents
-- Note: Storage buckets must be created via Supabase dashboard or API
-- This is just a reference for the bucket setup needed

-- Bucket name: documents
-- Public: false (documents are private per user)
-- Allowed MIME types: application/pdf, image/jpeg, image/png, image/tiff
-- Max file size: 52428800 (50MB)

-- RLS Policy for bucket storage
-- users can only access documents in their own user_id folder
