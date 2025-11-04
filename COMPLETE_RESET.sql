-- ================================================================
-- COMPLETE RESET AND SETUP
-- This will drop everything and recreate from scratch
-- Run this in Supabase SQL Editor
-- ================================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS document_processed_at_trigger ON public.documents;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_document_processed_at() CASCADE;

-- Drop existing tables
DROP TABLE IF EXISTS public.extracted_data CASCADE;
DROP TABLE IF EXISTS public.document_fields CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ================================================================
-- CREATE TABLES
-- ================================================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. DOCUMENTS TABLE
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz
);

-- 3. DOCUMENT_FIELDS TABLE
CREATE TABLE public.document_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'email', 'phone', 'currency', 'boolean')),
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. EXTRACTED_DATA TABLE
CREATE TABLE public.extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.document_fields ON DELETE CASCADE,
  value text,
  confidence numeric(5,4),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(document_id, field_id)
);

-- ================================================================
-- ENABLE RLS
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_data ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- CREATE POLICIES
-- ================================================================

-- Profiles policies
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "documents_select_own" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "documents_insert_own" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "documents_update_own" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "documents_delete_own" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Document fields policies
CREATE POLICY "document_fields_select_own" ON public.document_fields FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "document_fields_insert_own" ON public.document_fields FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "document_fields_update_own" ON public.document_fields FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "document_fields_delete_own" ON public.document_fields FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_fields.document_id AND documents.user_id = auth.uid())
);

-- Extracted data policies
CREATE POLICY "extracted_data_select_own" ON public.extracted_data FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "extracted_data_insert_own" ON public.extracted_data FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "extracted_data_update_own" ON public.extracted_data FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "extracted_data_delete_own" ON public.extracted_data FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.documents WHERE documents.id = extracted_data.document_id AND documents.user_id = auth.uid())
);

-- ================================================================
-- CREATE TRIGGER FUNCTION
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    'user_' || substring(NEW.id::text from 1 for 8),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- CREATE PROCESSED_AT TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_document_processed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.processed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_processed_at_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_processed_at();

-- ================================================================
-- BACKFILL EXISTING USERS
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
-- VERIFICATION
-- ================================================================
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profiles,
  (SELECT COUNT(*) FROM public.documents) as documents,
  (SELECT COUNT(*) FROM public.document_fields) as document_fields,
  (SELECT COUNT(*) FROM public.extracted_data) as extracted_data;
