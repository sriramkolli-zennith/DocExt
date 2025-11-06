-- ================================================================
-- DOCEXT - DATABASE SETUP & CONFIGURATION
-- Complete SQL schema for DocExtract application
-- Run this in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- SECTION 1: PROFILES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- ================================================================
-- SECTION 2: DOCUMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at timestamp with time zone
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON public.documents 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own" ON public.documents 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own" ON public.documents 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "documents_delete_own" ON public.documents 
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- SECTION 3: DOCUMENT_FIELDS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.document_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'email', 'phone', 'currency', 'boolean')),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_fields_select_own" ON public.document_fields 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_insert_own" ON public.document_fields 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_update_own" ON public.document_fields 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "document_fields_delete_own" ON public.document_fields 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_fields.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- ================================================================
-- SECTION 4: EXTRACTED_DATA TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.document_fields ON DELETE CASCADE,
  value text,
  confidence numeric(5,4),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(document_id, field_id)
);

ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extracted_data_select_own" ON public.extracted_data 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "extracted_data_insert_own" ON public.extracted_data 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "extracted_data_update_own" ON public.extracted_data 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "extracted_data_delete_own" ON public.extracted_data 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = extracted_data.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- ================================================================
-- SECTION 5: FUNCTIONS & TRIGGERS
-- ================================================================

-- Function 1: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  username_value text;
  attempt_count int := 0;
BEGIN
  -- Generate base username from metadata or email
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Ensure username is at least 3 characters
  IF char_length(username_value) < 3 THEN
    username_value := username_value || '_user';
  END IF;
  
  -- Try to insert, handle unique constraint violations
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
      
      EXIT; -- Success, exit loop
      
    EXCEPTION WHEN unique_violation THEN
      -- Username already exists, try with suffix
      attempt_count := attempt_count + 1;
      IF attempt_count > 100 THEN
        -- Fallback to UUID-based username
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

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function 2: Update processed_at when status changes to completed
CREATE OR REPLACE FUNCTION public.update_document_processed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.processed_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: document_processed_at_trigger
DROP TRIGGER IF EXISTS document_processed_at_trigger ON public.documents;
CREATE TRIGGER document_processed_at_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_processed_at();

-- ================================================================
-- SECTION 6: STORAGE BUCKET & POLICIES
-- ================================================================

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "users_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "public_read_for_processing" ON storage.objects;

-- Storage policies
CREATE POLICY "users_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_view_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- SECTION 7: STORAGE BUCKET (Documents)
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
-- SECTION 8: VERIFICATION
-- ================================================================

SELECT 
  'Database Setup Complete!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.documents) as documents_count,
  (SELECT COUNT(*) FROM public.document_fields) as fields_count,
  (SELECT COUNT(*) FROM public.extracted_data) as data_count;
