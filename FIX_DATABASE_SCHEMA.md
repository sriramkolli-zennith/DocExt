# Fix Database Schema Issue

## Problem
The edge function is failing with error:
```
Could not find the 'file_url' column of 'documents' in the schema cache
```

This means the database schema doesn't match what the edge functions expect.

## Solution

### Step 1: Run the SQL Script in Supabase

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/lputifqvrradmfedheov/editor

2. Click on **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy and paste this SQL script:

```sql
-- Fix documents table schema
-- Add file_path column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'documents' 
          AND column_name = 'file_path'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN file_path text;
    END IF;
END $$;

-- Add public_url column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'documents' 
          AND column_name = 'public_url'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN public_url text;
    END IF;
END $$;

-- Remove file_url if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'documents' 
          AND column_name = 'file_url'
    ) THEN
        -- Copy data first
        UPDATE public.documents 
        SET public_url = file_url 
        WHERE public_url IS NULL AND file_url IS NOT NULL;
        
        -- Drop old column
        ALTER TABLE public.documents DROP COLUMN file_url;
    END IF;
END $$;
```

5. Click **Run** or press `Ctrl+Enter`

6. You should see messages confirming the columns were added

### Step 2: Verify the Schema

Run this query to check the current table structure:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'documents'
ORDER BY ordinal_position;
```

You should see these columns:
- `id` (uuid)
- `user_id` (uuid)
- `name` (text)
- `file_path` (text)
- `public_url` (text)
- `model_id` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Step 3: Re-deploy Edge Functions

Since we updated the process-document-backend function to use the correct column names, redeploy it:

1. Make sure Docker Desktop is running
2. Run:
   ```bash
   npm run functions:deploy:process
   ```

### Step 4: Test the Application

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/extract

3. Try uploading a document and extracting fields

4. The error should be resolved!

## What Changed

### Edge Function Updates
- Changed `file_url: publicUrl` → `file_path: filePath, public_url: publicUrl`
- This matches the new database schema

### Database Schema
- **Removed**: `file_url` column (was causing the error)
- **Added**: `file_path` column (stores the storage path like `user123/invoice.pdf`)
- **Added**: `public_url` column (stores the full public URL to access the file)

This separation makes more sense:
- `file_path`: Internal storage reference
- `public_url`: Actual URL to access the file

## Troubleshooting

If you still get errors:

1. **Check the edge function logs**:
   ```bash
   npm run functions:logs
   ```

2. **Verify columns exist**:
   Go to Supabase Dashboard → Table Editor → documents table
   Check that `file_path` and `public_url` columns are visible

3. **Re-deploy all functions**:
   ```bash
   npm run functions:deploy
   ```

4. **Clear browser cache** and try again
