-- ================================================================
-- VERIFICATION: Check if Label Bounding Boxes are Being Stored
-- ================================================================

-- 1. Check if columns exist in extracted_data table
SELECT 
  'Column Existence Check' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'extracted_data'
  AND column_name IN (
    'top3_label_page_numbers',
    'top3_label_bounding_boxes'
  )
ORDER BY ordinal_position;

-- 2. Check if any data exists with label bounding boxes
SELECT 
  'Data Check - Top 3 Label Data' as check_type,
  COUNT(*) as total_records,
  COUNT(top3_label_page_numbers) as records_with_label_pages,
  COUNT(top3_label_bounding_boxes) as records_with_label_boxes,
  COUNT(CASE WHEN top3_label_page_numbers IS NOT NULL AND top3_label_bounding_boxes IS NOT NULL THEN 1 END) as records_with_both
FROM extracted_data;

-- 3. Show sample data with label information (most recent 5 records)
SELECT 
  'Sample Data' as check_type,
  id,
  value,
  top3_values,
  top3_label_page_numbers,
  jsonb_array_length(COALESCE(top3_label_bounding_boxes, '[]'::jsonb)) as label_box_count,
  created_at
FROM extracted_data
WHERE top3_label_page_numbers IS NOT NULL 
  OR top3_label_bounding_boxes IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 4. Detailed view of one record to see actual label data structure
SELECT 
  'Detailed Record Example' as check_type,
  id,
  value,
  confidence,
  top3_values,
  top3_confidences,
  top3_page_numbers,
  top3_label_page_numbers,
  top3_label_bounding_boxes
FROM extracted_data
WHERE top3_label_page_numbers IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- 5. Check document_fields table for label data
SELECT 
  'Document Fields Label Data' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'document_fields'
  AND column_name IN (
    'label_page_number',
    'label_bounding_box'
  );

-- 6. Check if document_fields has label data
SELECT 
  'Document Fields Data Check' as check_type,
  COUNT(*) as total_fields,
  COUNT(label_page_number) as fields_with_label_page,
  COUNT(label_bounding_box) as fields_with_label_box
FROM document_fields;

-- 7. Sample document_fields with label data
SELECT 
  'Document Fields Sample' as check_type,
  id,
  name,
  page_number as value_page,
  label_page_number,
  bounding_box IS NOT NULL as has_value_box,
  label_bounding_box IS NOT NULL as has_label_box
FROM document_fields
WHERE label_page_number IS NOT NULL OR label_bounding_box IS NOT NULL
LIMIT 5;
