-- ================================================================
-- MIGRATION: ADD TOP 3 VALUES AND USER FEEDBACK SUPPORT
-- ================================================================

-- Add new columns to extracted_data table for storing top 3 alternatives
ALTER TABLE public.extracted_data 
ADD COLUMN IF NOT EXISTS top3_values jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top3_confidences jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top3_page_numbers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top3_bounding_boxes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top3_label_page_numbers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS top3_label_bounding_boxes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_feedback text CHECK (user_feedback IN ('thumbs_up', 'thumbs_down', NULL)) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_manually_selected boolean DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS selected_from_top3_index integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS feedback_timestamp timestamp with time zone DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.extracted_data.top3_values IS 'Array of top 3 extracted values: ["value1", "value2", "value3"]';
COMMENT ON COLUMN public.extracted_data.top3_confidences IS 'Array of top 3 confidence scores: [0.95, 0.87, 0.75]';
COMMENT ON COLUMN public.extracted_data.top3_page_numbers IS 'Array of top 3 page numbers: [1, 1, 2]';
COMMENT ON COLUMN public.extracted_data.top3_bounding_boxes IS 'Array of top 3 bounding boxes: [[x1,y1,x2,y2,...], [...], [...]]';
COMMENT ON COLUMN public.extracted_data.top3_label_page_numbers IS 'Array of top 3 label page numbers: [1, 1, 2]';
COMMENT ON COLUMN public.extracted_data.top3_label_bounding_boxes IS 'Array of top 3 label bounding boxes: [[x1,y1,x2,y2,...], [...], [...]]';
COMMENT ON COLUMN public.extracted_data.user_feedback IS 'User feedback: thumbs_up, thumbs_down, or NULL';
COMMENT ON COLUMN public.extracted_data.is_manually_selected IS 'TRUE if user selected value from top3 alternatives';
COMMENT ON COLUMN public.extracted_data.selected_from_top3_index IS 'Index (0-3) of value selected from top3 array';
COMMENT ON COLUMN public.extracted_data.feedback_timestamp IS 'Timestamp when user provided feedback';

-- Create index for faster feedback queries
CREATE INDEX IF NOT EXISTS idx_extracted_data_feedback 
ON public.extracted_data(user_feedback, feedback_timestamp) 
WHERE user_feedback IS NOT NULL;

-- Create index for manually selected values
CREATE INDEX IF NOT EXISTS idx_extracted_data_manual 
ON public.extracted_data(is_manually_selected) 
WHERE is_manually_selected = TRUE;

-- ================================================================
-- VERIFICATION
-- ================================================================

SELECT 
  'Migration Complete!' as status,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'extracted_data'
  AND column_name IN (
    'top3_values', 
    'top3_confidences', 
    'top3_page_numbers', 
    'top3_bounding_boxes',
    'top3_label_page_numbers',
    'top3_label_bounding_boxes',
    'user_feedback', 
    'is_manually_selected',
    'selected_from_top3_index',
    'feedback_timestamp'
  )
ORDER BY ordinal_position;
