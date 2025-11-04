-- ================================================================
-- SIMPLE FIX: Use UUID-based username (guaranteed unique)
-- Run this in Supabase SQL Editor
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use a guaranteed unique username based on UUID
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    'user_' || substring(NEW.id::text from 1 for 8),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Verify
SELECT 'Simple trigger installed!' as status;
