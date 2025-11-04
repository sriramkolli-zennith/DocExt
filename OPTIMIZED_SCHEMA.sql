-- ================================================================
-- OPTIMIZED DATABASE SCHEMA FOR DOCEXT
-- This schema is minimal, efficient, and perfectly aligned with
-- frontend code and edge functions
-- ================================================================

-- ================================================================
-- 1. PROFILES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles_select_public" ON profiles 
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- ================================================================
-- 2. DOCUMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "documents_select_own" ON documents 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own" ON documents 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own" ON documents 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "documents_delete_own" ON documents 
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 3. DOCUMENT_FIELDS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS document_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'email', 'phone', 'currency', 'boolean')),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE document_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "document_fields_select_own" ON document_fields 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_insert_own" ON document_fields 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_update_own" ON document_fields 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_delete_own" ON document_fields 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
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
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(document_id, field_id)
);

-- Enable RLS
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "extracted_data_select_own" ON extracted_data 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "extracted_data_insert_own" ON extracted_data 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "extracted_data_update_own" ON extracted_data 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "extracted_data_delete_own" ON extracted_data 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
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
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
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
    NEW.processed_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS document_processed_at_trigger ON documents;

-- Create trigger
CREATE TRIGGER document_processed_at_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_processed_at();

-- ================================================================
-- 6. STORAGE BUCKET & POLICIES
-- ================================================================

-- Create documents bucket (public for Azure access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "public_read_for_processing" ON storage.objects;

-- Users can upload to their own folder
CREATE POLICY "users_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own documents
CREATE POLICY "users_view_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own documents
CREATE POLICY "users_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own documents
CREATE POLICY "users_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access for Azure Document Intelligence
CREATE POLICY "public_read_for_processing" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- ================================================================
-- 7. BACKFILL EXISTING USERS
-- ================================================================

-- Create profiles for existing users who don't have one
INSERT INTO profiles (id, username, full_name, avatar_url)
SELECT 
  au.id,
  split_part(au.email, '@', 1),
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 8. VERIFICATION
-- ================================================================

-- Display schema summary
SELECT 
  'Schema Setup Complete!' as status,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM documents) as documents,
  (SELECT COUNT(*) FROM document_fields) as document_fields,
  (SELECT COUNT(*) FROM extracted_data) as extracted_data;
