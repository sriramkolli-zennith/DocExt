-- Migration: add file_hash column and unique index for duplicate prevention
-- Run this in Supabase SQL Editor after deploying the updated code

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS documents_user_hash_unique
ON public.documents(user_id, file_hash)
WHERE file_hash IS NOT NULL;

-- Optional: initialize hashes for existing records manually by uploading replacements
SELECT 'file_hash column ready' as status;
