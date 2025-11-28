-- Migration: Add feedback_attempt_count column to extracted_data table
-- Run this in Supabase SQL Editor if you already have the database set up

-- Add the feedback_attempt_count column
ALTER TABLE public.extracted_data 
ADD COLUMN IF NOT EXISTS feedback_attempt_count integer DEFAULT 0;

-- Update existing rows to have 0 attempts
UPDATE public.extracted_data 
SET feedback_attempt_count = 0 
WHERE feedback_attempt_count IS NULL;

-- Verify the column was added
SELECT 
  'Migration Complete' AS status,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE feedback_attempt_count = 0) AS rows_with_zero_attempts
FROM public.extracted_data;
