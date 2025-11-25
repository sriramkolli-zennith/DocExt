-- ================================================================
-- ADD FIELD RECOMMENDATIONS TABLE
-- Run this to enable AI-powered field recommendations feature
-- Each missing field gets its own contextual top 3 recommendations
-- ================================================================

-- Create field_recommendations table with field-specific tracking
CREATE TABLE IF NOT EXISTS public.field_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents ON DELETE CASCADE,
  missing_field_id uuid NOT NULL REFERENCES public.document_fields ON DELETE CASCADE,
  missing_field_name text NOT NULL,
  recommended_field_name text NOT NULL,
  field_value text,
  confidence numeric(5,4),
  relevance_score integer CHECK (relevance_score >= 0 AND relevance_score <= 100),
  field_type text DEFAULT 'text',
  page_number integer,
  bounding_box jsonb,
  label_page_number integer,
  label_bounding_box jsonb,
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 3),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(document_id, missing_field_id, recommended_field_name)
);

-- Enable RLS
ALTER TABLE public.field_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "field_recommendations_select_own" ON public.field_recommendations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = field_recommendations.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "field_recommendations_insert_own" ON public.field_recommendations 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = field_recommendations.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "field_recommendations_delete_own" ON public.field_recommendations 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = field_recommendations.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_field_recommendations_document_rank 
ON public.field_recommendations(document_id, rank);

CREATE INDEX IF NOT EXISTS idx_field_recommendations_missing_field 
ON public.field_recommendations(missing_field_id, rank);

-- Verify
SELECT 'Field-Specific Recommendations Table Created!' as status;
