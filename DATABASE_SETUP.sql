-- ================================================================
-- DOCEXT - SINGLE SOURCE DATABASE SCRIPT
-- Run this script in the Supabase SQL Editor (or supabase db push)
-- to provision the entire schema, policies, triggers, indexes,
-- and verification queries required by the DocExt platform.
-- ================================================================

-- ================================================================
-- OPTIONAL RESET (UNCOMMENT IF YOU NEED A CLEAN SLATE)
-- ================================================================
/*
DROP TABLE IF EXISTS public.field_recommendations CASCADE;
DROP TABLE IF EXISTS public.extracted_data CASCADE;
DROP TABLE IF EXISTS public.document_fields CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS document_processed_at_trigger ON public.documents;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_document_processed_at() CASCADE;

DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;

DELETE FROM storage.objects WHERE bucket_id = 'documents';
DELETE FROM storage.buckets WHERE id = 'documents';
*/

-- ================================================================
-- SECTION 1: EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- SECTION 2: CORE TABLES & POLICIES
-- ================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- DOCUMENTS (includes original_filename + file_hash)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  original_filename text,
  file_hash text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at timestamptz
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_select_own" ON public.documents;
CREATE POLICY "documents_select_own" ON public.documents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
CREATE POLICY "documents_insert_own" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "documents_update_own" ON public.documents;
CREATE POLICY "documents_update_own" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;
CREATE POLICY "documents_delete_own" ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS documents_user_hash_unique
  ON public.documents(user_id, file_hash)
  WHERE file_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_original_filename
  ON public.documents(user_id, original_filename)
  WHERE original_filename IS NOT NULL;

-- DOCUMENT_FIELDS (captures label metadata)
CREATE TABLE IF NOT EXISTS public.document_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'email', 'phone', 'currency', 'boolean', 'address', 'url')),
  description text,
  page_number integer,
  bounding_box jsonb,
  label_page_number integer,
  label_bounding_box jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "document_fields_select_own" ON public.document_fields;
CREATE POLICY "document_fields_select_own" ON public.document_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_fields.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "document_fields_insert_own" ON public.document_fields;
CREATE POLICY "document_fields_insert_own" ON public.document_fields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_fields.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "document_fields_update_own" ON public.document_fields;
CREATE POLICY "document_fields_update_own" ON public.document_fields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_fields.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "document_fields_delete_own" ON public.document_fields;
CREATE POLICY "document_fields_delete_own" ON public.document_fields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = document_fields.document_id
        AND documents.user_id = auth.uid()
    )
  );

-- EXTRACTED_DATA (stores top alternatives + feedback)
CREATE TABLE IF NOT EXISTS public.extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.document_fields ON DELETE CASCADE,
  value text,
  confidence numeric(5,4),
  top3_values jsonb DEFAULT '[]'::jsonb,
  top3_confidences jsonb DEFAULT '[]'::jsonb,
  top3_page_numbers jsonb DEFAULT '[]'::jsonb,
  top3_bounding_boxes jsonb DEFAULT '[]'::jsonb,
  top3_label_page_numbers jsonb DEFAULT '[]'::jsonb,
  top3_label_bounding_boxes jsonb DEFAULT '[]'::jsonb,
  user_feedback text CHECK (user_feedback IN ('thumbs_up', 'thumbs_down') OR user_feedback IS NULL),
  is_manually_selected boolean DEFAULT false,
  selected_from_top3_index integer,
  feedback_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(document_id, field_id)
);

ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "extracted_data_select_own" ON public.extracted_data;
CREATE POLICY "extracted_data_select_own" ON public.extracted_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = extracted_data.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "extracted_data_insert_own" ON public.extracted_data;
CREATE POLICY "extracted_data_insert_own" ON public.extracted_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = extracted_data.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "extracted_data_update_own" ON public.extracted_data;
CREATE POLICY "extracted_data_update_own" ON public.extracted_data
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = extracted_data.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "extracted_data_delete_own" ON public.extracted_data;
CREATE POLICY "extracted_data_delete_own" ON public.extracted_data
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = extracted_data.document_id
        AND documents.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_extracted_data_feedback
  ON public.extracted_data(user_feedback, feedback_timestamp)
  WHERE user_feedback IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_extracted_data_manual
  ON public.extracted_data(is_manually_selected)
  WHERE is_manually_selected = true;

-- FIELD RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.field_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  missing_field_id uuid NOT NULL REFERENCES public.document_fields ON DELETE CASCADE,
  missing_field_name text NOT NULL,
  recommended_field_name text NOT NULL,
  field_value text,
  confidence numeric(5,4),
  relevance_score integer CHECK (relevance_score BETWEEN 0 AND 100),
  field_type text DEFAULT 'text',
  page_number integer,
  bounding_box jsonb,
  label_page_number integer,
  label_bounding_box jsonb,
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(document_id, missing_field_id, recommended_field_name)
);

ALTER TABLE public.field_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "field_recommendations_select_own" ON public.field_recommendations;
CREATE POLICY "field_recommendations_select_own" ON public.field_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = field_recommendations.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "field_recommendations_insert_own" ON public.field_recommendations;
CREATE POLICY "field_recommendations_insert_own" ON public.field_recommendations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = field_recommendations.document_id
        AND documents.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "field_recommendations_delete_own" ON public.field_recommendations;
CREATE POLICY "field_recommendations_delete_own" ON public.field_recommendations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = field_recommendations.document_id
        AND documents.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_field_recommendations_document_rank
  ON public.field_recommendations(document_id, rank);

CREATE INDEX IF NOT EXISTS idx_field_recommendations_missing_field
  ON public.field_recommendations(missing_field_id, rank);

-- ================================================================
-- SECTION 3: FUNCTIONS & TRIGGERS
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  username_value text;
  attempt_count int := 0;
BEGIN
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  IF char_length(username_value) < 3 THEN
    username_value := username_value || '_user';
  END IF;

  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username, full_name, avatar_url)
      VALUES (
        NEW.id,
        CASE 
          WHEN attempt_count = 0 THEN username_value
          ELSE username_value || '_' || attempt_count::text
        END,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO NOTHING;

      EXIT;

    EXCEPTION WHEN unique_violation THEN
      attempt_count := attempt_count + 1;
      IF attempt_count > 100 THEN
        username_value := 'user_' || substring(NEW.id::text from 1 for 8);
        attempt_count := 0;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_document_processed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    NEW.processed_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_processed_at_trigger ON public.documents;
CREATE TRIGGER document_processed_at_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_processed_at();

-- ================================================================
-- SECTION 4: STORAGE BUCKET & POLICIES
-- ================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
CREATE POLICY "users_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_view_own" ON storage.objects;
CREATE POLICY "users_view_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
CREATE POLICY "users_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
CREATE POLICY "users_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- SECTION 5: DATA BACKFILL (OPTIONAL BUT SAFE TO RUN)
-- ================================================================
INSERT INTO public.profiles (id, username, full_name, avatar_url)
SELECT 
  au.id,
  'user_' || substring(au.id::text from 1 for 8),
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SECTION 6: VERIFICATION QUERIES
-- ================================================================

SELECT 
  'Database Setup Complete!' AS status,
  (SELECT COUNT(*) FROM public.profiles) AS profiles_count,
  (SELECT COUNT(*) FROM public.documents) AS documents_count,
  (SELECT COUNT(*) FROM public.document_fields) AS fields_count,
  (SELECT COUNT(*) FROM public.extracted_data) AS data_count,
  (SELECT COUNT(*) FROM public.field_recommendations) AS recommendations_count,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'documents') AS storage_bucket_exists;

-- Inspect label metadata coverage
SELECT 
  'Document Fields Label Data' AS check_type,
  COUNT(*) AS total_fields,
  COUNT(label_page_number) AS fields_with_label_page,
  COUNT(label_bounding_box) AS fields_with_label_box
FROM public.document_fields;

-- Confirm extracted_data feedback columns
SELECT 
  'Extracted Data Feedback' AS check_type,
  COUNT(*) FILTER (WHERE user_feedback IS NOT NULL) AS rows_with_feedback,
  COUNT(*) FILTER (WHERE is_manually_selected) AS manually_selected_rows,
  COUNT(*) AS total_rows
FROM public.extracted_data;

-- Sample recommendations snapshot
SELECT 
  document_id,
  missing_field_name,
  recommended_field_name,
  rank,
  confidence,
  relevance_score
FROM public.field_recommendations
ORDER BY created_at DESC
LIMIT 5;

-- Label bounding verification sample
SELECT 
  id,
  value,
  top3_label_page_numbers,
  jsonb_array_length(COALESCE(top3_label_bounding_boxes, '[]'::jsonb)) AS label_box_count,
  created_at
FROM public.extracted_data
WHERE top3_label_page_numbers IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
