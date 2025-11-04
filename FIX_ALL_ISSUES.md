# 🔧 Fix All Issues - Complete Guide

## Issues Found:

1. ❌ **No extracted fields showing** - Using wrong table names in frontend
2. ❌ **Profile not saved** - Trigger not created in database
3. ❌ **Add field fails** - Wrong table structure in code

---

## ✅ **Step-by-Step Fix**

### Step 1: Fix Database (CRITICAL - Do This First!)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/lputifqvrradmfedheov/sql/new

2. **Run the SQL file:**
   - Open `FIX_DATABASE.sql` in your project
   - Copy all the SQL code
   - Paste into Supabase SQL Editor
   - Click **RUN** button

3. **Verify the output shows:**
   ```
   Setup Complete!
   profile_count: X
   document_count: X
   field_count: X
   extracted_data_count: X
   ```

This SQL will:
- ✅ Create trigger to auto-create profiles on signup
- ✅ Create trigger to update document status
- ✅ Create all RLS policies for new tables
- ✅ Backfill profiles for existing users
- ✅ Enable Row Level Security

---

### Step 2: Frontend Already Fixed! ✅

The following files have been updated:

#### `app/document/[id]/page.tsx` ✅
- Updated `handleAddField` to use `document_fields` table
- Updated `handleDeleteField` to use `document_fields` and `extracted_data` tables
- Updated `handleFieldValueChange` to upsert in `extracted_data` table
- Fixed interface to match new schema
- Fixed data fetching to use `extractedFields`

#### `app/dashboard/page.tsx` ✅
- Updated interface to use correct column names
- Fixed CSS class

#### `components/document-card.tsx` ✅
- Updated to show `status` instead of `model_id`
- Fixed interface to match new schema

#### `components/field-validation-modal.tsx` ✅
- Updated interface to use new field names
- Fixed all references

---

### Step 3: Test Everything

#### Test 1: Profile Creation
1. **Sign up with a new account** (or check existing account)
2. **Check Supabase Dashboard:**
   - Go to Table Editor → `profiles`
   - You should see a profile created automatically with:
     - `id` (matching auth user)
     - `username` (from email)
     - Created timestamp

#### Test 2: Upload & Process Document
1. **Go to `/extract` page**
2. **Upload a document** (PDF or image)
3. **Add fields to extract:**
   - InvoiceId
   - VendorName
   - Total
4. **Click "Extract Fields"**
5. **Wait for processing** (10-30 seconds)
6. **Check Dashboard** - document should appear

#### Test 3: View Document Details
1. **Click on a processed document**
2. **You should see:**
   - Document name and status
   - All extracted fields with values
   - Confidence scores
3. **Try adding a new field manually**
4. **Try editing a field value**
5. **Try deleting a field**

---

## 🔍 **Debugging if Issues Persist**

### Issue: "No extracted fields showing"

**Check in Supabase Dashboard:**

1. **Table Editor → `documents`**
   - Verify document exists
   - Check `status` column (should be "completed")
   - Note the document `id`

2. **Table Editor → `document_fields`**
   - Filter by `document_id` = your document id
   - Should see field definitions
   - Note the field `id` values

3. **Table Editor → `extracted_data`**
   - Filter by `document_id` = your document id
   - Should see rows with:
     - `field_id` (matching document_fields)
     - `value` (extracted value)
     - `confidence` (score)

**If missing:**
- Re-run the edge function to process the document
- Check edge function logs: `npx supabase functions logs process-document-backend --tail`

### Issue: "Profile not created"

**Check in Supabase Dashboard:**

1. **Table Editor → `profiles`**
   - Should have a row for your user

2. **If missing, run this SQL:**
```sql
-- Manually create profile
INSERT INTO public.profiles (id, username, full_name)
SELECT 
  id,
  SPLIT_PART(email, '@', 1),
  raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id = 'YOUR_USER_ID'
ON CONFLICT (id) DO NOTHING;
```

3. **Check trigger exists:**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### Issue: "Add field still fails"

**Check browser console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Try adding a field
4. Look for detailed error message

**Common errors:**
- `permission denied` → RLS policies not created (run FIX_DATABASE.sql)
- `column does not exist` → Using wrong column names (code already fixed)
- `foreign key constraint` → Document doesn't exist or wrong ID

---

## 📊 **Database Schema Reference**

### Current 4-Table Structure:

```
profiles
├── id (PK, FK to auth.users)
├── username
├── full_name
├── avatar_url
└── created_at

documents
├── id (PK)
├── user_id (FK to auth.users)
├── name
├── storage_path
├── status (pending/processing/completed/failed)
├── created_at
└── processed_at

document_fields
├── id (PK)
├── document_id (FK to documents)
├── name
├── type
├── description
└── created_at

extracted_data
├── id (PK)
├── document_id (FK to documents)
├── field_id (FK to document_fields)
├── value
├── confidence
└── created_at
└── UNIQUE(document_id, field_id)
```

---

## 🎯 **Expected Behavior After Fix**

### Signup/Login:
1. User signs up → Profile auto-created ✅
2. User logs in → Session persists ✅

### Upload Document:
1. Upload file → File stored in Supabase Storage ✅
2. Process → Document record created (status: processing) ✅
3. Process → Field definitions created in `document_fields` ✅
4. Azure processes → Extracted data saved to `extracted_data` ✅
5. Complete → Document status updated to "completed" ✅

### View Document:
1. Dashboard shows all user's documents ✅
2. Click document → Shows all extracted fields with values ✅
3. Add field → Creates in `document_fields` table ✅
4. Edit value → Upserts in `extracted_data` table ✅
5. Delete field → Removes from both tables ✅

---

## ✅ **Final Checklist**

- [ ] Run `FIX_DATABASE.sql` in Supabase SQL Editor
- [ ] Verify triggers created (check SQL output)
- [ ] Verify RLS policies created (check SQL output)
- [ ] Build project: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Test signup → Profile created
- [ ] Test upload → Document processed
- [ ] Test view details → Fields displayed
- [ ] Test add field → Field added successfully
- [ ] Test edit field → Value updated
- [ ] Test delete field → Field removed

---

## 🚨 **Critical Actions Required**

### **1. RUN FIX_DATABASE.sql NOW** ⚠️
This is the most important step! Without it:
- Profiles won't be created
- RLS policies won't work
- Field operations will fail

### **2. Verify in Supabase Dashboard**
After running the SQL, check:
- Database → Triggers (should see `on_auth_user_created`)
- Authentication → Policies (should see policies for all 4 tables)
- Table Editor → `profiles` (should have rows)

---

## 📞 **Support**

If issues persist after following all steps:

1. **Check edge function logs:**
   ```bash
   npx supabase functions logs process-document-backend --tail
   ```

2. **Check browser console** for detailed errors

3. **Verify database state** in Supabase Dashboard

4. **Test API directly:**
   ```bash
   curl -X POST https://lputifqvrradmfedheov.supabase.co/functions/v1/get-extracted-data-backend \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"documentId": "YOUR_DOC_ID"}'
   ```

---

**Status:** 🟡 **ACTION REQUIRED**  
**Next Step:** Run `FIX_DATABASE.sql` in Supabase SQL Editor NOW!
