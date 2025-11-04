-- ================================================================
-- CLEAN DATABASE SCHEMA FOR DOCEXT
-- Run this in Supabase SQL Editor
-- ================================================================

-- Create public schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- ================================================================
-- 1. PROFILES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ================================================================
-- 2. DOCUMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_own" ON documents;
DROP POLICY IF EXISTS "documents_insert_own" ON documents;
DROP POLICY IF EXISTS "documents_update_own" ON documents;
DROP POLICY IF EXISTS "documents_delete_own" ON documents;

CREATE POLICY "documents_select_own" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert_own" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_own" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "documents_delete_own" ON documents FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 3. DOCUMENT_FIELDS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS document_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'email', 'phone', 'currency', 'boolean')),
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE document_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_fields_select_own" ON document_fields;
DROP POLICY IF EXISTS "document_fields_insert_own" ON document_fields;
DROP POLICY IF EXISTS "document_fields_update_own" ON document_fields;
DROP POLICY IF EXISTS "document_fields_delete_own" ON document_fields;

CREATE POLICY "document_fields_select_own" ON document_fields FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);

CREATE POLICY "document_fields_insert_own" ON document_fields FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);

CREATE POLICY "document_fields_update_own" ON document_fields FOR UPDATE USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);

CREATE POLICY "document_fields_delete_own" ON document_fields FOR DELETE USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);

-- ================================================================
-- 4. EXTRACTED_DATA TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES document_fields ON DELETE CASCADE,
  value text,
  confidence numeric(5,4),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(document_id, field_id)
);

ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extracted_data_select_own" ON extracted_data;
DROP POLICY IF EXISTS "extracted_data_insert_own" ON extracted_data;
DROP POLICY IF EXISTS "extracted_data_update_own" ON extracted_data;
DROP POLICY IF EXISTS "extracted_data_delete_own" ON extracted_data;

CREATE POLICY "extracted_data_select_own" ON extracted_data FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);

CREATE POLICY "extracted_data_insert_own" ON extracted_data FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);

CREATE POLICY "extracted_data_update_own" ON extracted_data FOR UPDATE USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);

CREATE POLICY "extracted_data_delete_own" ON extracted_data FOR DELETE USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);

-- ================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  username_value text;
BEGIN
  -- Generate username from metadata or email
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Ensure username is at least 3 characters
  IF char_length(username_value) < 3 THEN
    username_value := username_value || '_user';
  END IF;
  
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    username_value,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update processed_at when status changes to completed
CREATE OR REPLACE FUNCTION update_document_processed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.processed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_processed_at_trigger ON documents;
CREATE TRIGGER document_processed_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_processed_at();

-- ================================================================
-- 6. STORAGE BUCKET & POLICIES
-- ================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "public_read_for_processing" ON storage.objects;

CREATE POLICY "users_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_view_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "public_read_for_processing" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- ================================================================
-- 7. BACKFILL EXISTING USERS
-- ================================================================

INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT 
  au.id,
  split_part(au.email, '@', 1),
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 8. VERIFICATION
-- ================================================================

SELECT 
  'Schema Setup Complete!' as status,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM documents) as documents,
  (SELECT COUNT(*) FROM document_fields) as document_fields,
  (SELECT COUNT(*) FROM extracted_data) as extracted_data;
