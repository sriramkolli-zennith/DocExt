-- ================================================================
-- FIX: Update handle_new_user trigger to handle all edge cases
-- Run this in Supabase SQL Editor to fix signup issues
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
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
      INSERT INTO profiles (id, username, full_name, avatar_url)
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
END;
$$;

-- Verify the fix
SELECT 'Trigger function updated successfully!' as status;
