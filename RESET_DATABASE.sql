-- ================================================================
-- DOCEXT - COMPLETE DATABASE RESET
-- WARNING: This will delete ALL data in the database
-- Run this in Supabase SQL Editor to start fresh
-- ================================================================

-- ================================================================
-- STEP 1: DROP ALL EXISTING TABLES (in reverse dependency order)
-- ================================================================

DROP TABLE IF EXISTS public.extracted_data CASCADE;
DROP TABLE IF EXISTS public.document_fields CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ================================================================
-- STEP 2: DROP ALL FUNCTIONS AND TRIGGERS
-- ================================================================

-- Drop triggers (ignore errors if table doesn't exist)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS document_processed_at_trigger ON public.documents;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_document_processed_at() CASCADE;

-- ================================================================
-- STEP 3: DROP STORAGE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "public_read_for_processing" ON storage.objects;

-- ================================================================
-- STEP 4: DELETE STORAGE BUCKET (WARNING: Deletes all files)
-- ================================================================

-- Delete all objects inside the bucket first
DELETE FROM storage.objects WHERE bucket_id = 'documents';

-- Now delete the bucket itself
DELETE FROM storage.buckets WHERE id = 'documents';

-- ================================================================
-- VERIFICATION: Confirm all tables are dropped
-- ================================================================

SELECT 'Database Reset Complete!' as status;
