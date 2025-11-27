# Top Alternatives (Up to 4) - Deployment Guide

## Overview
This feature enhances the document extraction system to:
- Extract and store up to four matching values for each field (not just the best match)
- Allow users to approve (thumbs up) or reject (thumbs down) extracted values
- Show alternative values when users click thumbs down
- Highlight both field values AND labels in PDF viewer with different colors
- Track user feedback and manually selected values

## What Was Changed

### 1. Database Schema (MIGRATION_TOP3_FEEDBACK.sql)
**Location:** `/MIGRATION_TOP3_FEEDBACK.sql`

Added columns to `extracted_data` table:
- `top3_values` (JSONB): Array of up to 4 extracted values (column name retained for compatibility)
- `top3_confidences` (JSONB): Confidence scores for each value
- `top3_page_numbers` (JSONB): Page numbers for each value
- `top3_bounding_boxes` (JSONB): Bounding boxes for each value
- `top3_label_page_numbers` (JSONB): Page numbers for field labels
- `top3_label_bounding_boxes` (JSONB): Bounding boxes for field labels
- `user_feedback` (TEXT): 'thumbs_up', 'thumbs_down', or NULL
- `is_manually_selected` (BOOLEAN): TRUE if user picked from alternatives
- `selected_from_top3_index` (INTEGER): Which alternative was selected (0–3)
- `feedback_timestamp` (TIMESTAMPTZ): When feedback was given

### 2. Backend Edge Functions

#### A. process-document-backend (MODIFIED)
**Location:** `/supabase/functions/process-document-backend/index.ts`

Changes:
- Added `calculateMatchScore()` function with intelligent scoring (0-100 scale)
- Replaced `findAzureField()` with `findTopAzureFields()`
- Now finds up to 4 matches instead of just best match
- Stores all 6 new arrays for each field
- Preserves label bounding boxes from Azure response

Match Scoring Algorithm:
- 100: Exact match
- 95: Case-insensitive exact
- 90: Normalized exact (no special chars)
- 80-75: Contains relationship
- 70: Fuzzy prefix match
- 50+: Word overlap score

#### B. get-extracted-data-backend (MODIFIED)
**Location:** `/supabase/functions/get-extracted-data-backend/index.ts`

Changes:
- Updated SELECT query to include all new columns
- Returns top3 arrays and feedback fields in response
- Frontend receives complete data for UI display

#### C. update-field-feedback (NEW)
**Location:** `/supabase/functions/update-field-feedback/index.ts`

New endpoint with 3 actions:
1. **thumbs_up**: Mark value as approved
2. **thumbs_down**: Mark value as rejected (shows alternatives modal)
3. **select_from_top3**: User selects alternative (updates value, marks as manually selected)

Includes:
- Authentication and ownership validation
- Comprehensive logging
- Error handling
- CORS support

### 3. Frontend Components

#### A. field-validation-modal.tsx (REPLACED)
**Location:** `/components/field-validation-modal.tsx`

New modal shows:
- Current extracted value
- Up to four alternatives with confidence scores and page numbers
- Visual confidence bars
- Click to select any alternative
- Clean, modern UI

#### B. app/documents/[id]/page.tsx (ENHANCED)
**Location:** `/app/documents/[id]/page.tsx`

Added:
- ThumbsUp/ThumbsDown buttons next to each field value
- Visual feedback states (green when approved, red when rejected)
- "Manually selected" indicator
- Integration with feedback API
- Alternative selection flow
- Passes label bounding boxes to PDF viewer

#### C. lib/edge-functions.ts (ENHANCED)
**Location:** `/lib/edge-functions.ts`

Added:
- `updateFieldFeedback()` helper function

#### D. pdf-viewer-sidebar.tsx (ALREADY SUPPORTS LABELS!)
**Location:** `/components/pdf-viewer-sidebar.tsx`

Already has complete support for:
- Value bounding boxes (yellow/orange highlighting with pulse animation)
- Label bounding boxes (blue highlighting)
- Auto-scroll to highlighted regions
- Multi-page annotation support
- Zoom and navigation controls

The PDF viewer was already perfect - we just needed to pass the label data from the backend!

### 4. Package Configuration

**package.json** updated:
- Added `functions:deploy:feedback` script
- Updated main `functions:deploy` to include new feedback function
- Installed `react-pdf` library

## Deployment Steps

### Step 1: Apply Database Migration

```bash
# Connect to your Supabase project
cd /mnt/e/docext_uppermodel/my-app

# Run the migration SQL (via Supabase dashboard or CLI)
# Option A: Via Dashboard
# 1. Go to https://supabase.com/dashboard/project/lputifqvrradmfedheov/editor
# 2. Open SQL Editor
# 3. Copy contents of MIGRATION_TOP3_FEEDBACK.sql
# 4. Run the query

# Option B: Via Supabase CLI
supabase db push --linked
```

**IMPORTANT:** Run this BEFORE deploying edge functions, otherwise the functions will fail when trying to write to non-existent columns.

### Step 2: Deploy Edge Functions

```bash
# Deploy all functions (including the new feedback function)
npm run functions:deploy

# Or deploy individually:
npm run functions:deploy:process    # process-document-backend (modified)
npm run functions:deploy:data       # get-extracted-data-backend (modified)
npm run functions:deploy:feedback   # update-field-feedback (new)
```

### Step 3: Deploy Frontend

```bash
# If using Vercel or similar
npm run build
npm run deploy

# Or commit and push to trigger auto-deployment
git add .
git commit -m "feat: Add top alternatives with user feedback"
git push origin main
```

### Step 4: Verify Deployment

1. **Test Document Upload:**
   - Upload a new document
   - Check that extraction completes successfully
  - Verify top alternatives are saved (check database)

2. **Test PDF Viewer:**
   - Click on any extracted field
   - Verify PDF opens with BOTH value and label highlighted
   - Yellow/orange highlighting = extracted value
   - Blue highlighting = field label
   - Verify auto-scroll centers on the highlighted field

3. **Test Feedback Flow:**
   - Click thumbs up ✓ on a field → should turn green
   - Click thumbs down ✗ → modal should appear with alternatives
   - Select an alternative → value should update, show "Manually selected"
   - Verify feedback is saved in database

4. **Test Edge Cases:**
   - Fields with no alternatives (should disable thumbs down)
   - Re-running extraction on existing documents
   - Exporting data to CSV

## Database Verification

Check that data is being stored correctly:

```sql
-- View top alternative data for a specific document
SELECT 
  field_id,
  value,
  confidence,
  top3_values,
  top3_confidences,
  top3_page_numbers,
  user_feedback,
  is_manually_selected,
  selected_from_top3_index
FROM extracted_data
WHERE document_id = 'YOUR_DOCUMENT_ID';

-- Check label bounding boxes are saved
SELECT 
  field_id,
  top3_label_page_numbers,
  top3_label_bounding_boxes
FROM extracted_data
WHERE document_id = 'YOUR_DOCUMENT_ID'
  AND top3_label_bounding_boxes IS NOT NULL;

-- View feedback statistics
SELECT 
  user_feedback,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM extracted_data
WHERE user_feedback IS NOT NULL
GROUP BY user_feedback;
```

## Monitoring

### Edge Function Logs

```bash
# Watch all function logs
npm run functions:logs

# Watch process-document logs specifically
npm run functions:logs:process

# View feedback function logs
supabase functions logs update-field-feedback --project-ref lputifqvrradmfedheov --follow
```

### What to Look For:

In `process-document-backend` logs:
```
📊 Top matches (up to 4) for [field name]:
  1. [value] (score: XX, confidence: X.XX)
  2. [value] (score: XX, confidence: X.XX)
  3. [value] (score: XX, confidence: X.XX)
```

In `update-field-feedback` logs:
```
✅ User authenticated: [user_id]
📥 Request payload:
  - Extracted Data ID: [id]
  - Action: [thumbs_up/thumbs_down/select_from_top3]
  - Selected Index: [0/1/2/3]
✅ Processing [action] feedback
💾 Updating extracted_data record...
✅ Feedback updated successfully!
```

## Rollback Plan

If issues occur:

### Rollback Database:
```sql
-- Remove new columns (WARNING: loses data)
ALTER TABLE extracted_data
  DROP COLUMN IF EXISTS top3_values,
  DROP COLUMN IF EXISTS top3_confidences,
  DROP COLUMN IF EXISTS top3_page_numbers,
  DROP COLUMN IF EXISTS top3_bounding_boxes,
  DROP COLUMN IF EXISTS top3_label_page_numbers,
  DROP COLUMN IF EXISTS top3_label_bounding_boxes,
  DROP COLUMN IF EXISTS user_feedback,
  DROP COLUMN IF EXISTS is_manually_selected,
  DROP COLUMN IF EXISTS selected_from_top3_index,
  DROP COLUMN IF EXISTS feedback_timestamp;
```

### Rollback Edge Functions:
```bash
# Redeploy previous versions from git history
git checkout <previous-commit>
npm run functions:deploy
git checkout main
```

## Feature Usage

### For Users:

1. **Upload Document** → Extraction happens automatically
2. **View Results** → See extracted values with confidence scores
3. **Approve Good Values** → Click 👍 (turns green)
4. **Reject Bad Values** → Click 👎 (shows alternatives modal)
5. **Select Alternative** → Choose the correct value from up to 4 options
6. **View in PDF** → Click field name → PDF opens with highlights:
   - Yellow/orange = extracted value location
   - Blue = field label location
   - Auto-scrolls to center the field

### For Developers:

The matching algorithm uses a sophisticated scoring system:
- Prioritizes exact matches
- Falls back to case-insensitive matching
- Handles special characters and formatting differences
- Considers word overlap for partial matches
- Returns up to 4 alternatives (or fewer if not available)

The system is designed to help improve extraction accuracy over time by learning from user feedback.

## Success Metrics

Track these to measure feature success:
- % of fields with thumbs up feedback
- % of fields where users select alternatives
- Confidence scores of manually selected vs. auto-selected values
- Time spent per document (should decrease as users can quickly fix errors)

## Support

If you encounter issues:
1. Check edge function logs (see Monitoring section)
2. Verify database migration was applied
3. Check browser console for frontend errors
4. Review Supabase dashboard for RLS policy issues
5. Ensure Azure Document Intelligence is returning complete data (including labelBoundingRegions)

## Summary

✅ **Database:** Migration adds 10 new columns to track alternatives and feedback
✅ **Backend:** 3 edge functions (2 modified, 1 new) handle extraction and feedback
✅ **Frontend:** Enhanced UI with thumbs up/down, alternatives modal, and full PDF annotation
✅ **PDF Viewer:** Already perfect - highlights both values (yellow) and labels (blue)
✅ **Deployment:** Follow 4-step process above
✅ **Testing:** Comprehensive verification checklist included

The feature is production-ready and includes extensive logging for debugging.
