# 🎯 Quick Reference Card

## Edge Functions

### 1. upload-document
```typescript
const { data, error } = await uploadDocument(file, "Document Name")
// Returns: { filePath, publicUrl, uploadUrl }
```

### 2. process-document
```typescript
const { data, error } = await processDocument({
  documentName: "Invoice #123",
  filePath: "user-id/file.pdf",
  publicUrl: "https://...",
  fieldsToExtract: ["InvoiceId", "VendorName", "Total"]
})
// Returns: { documentId, extractedFieldsCount, status }
```

### 3. get-extracted-data
```typescript
const { data, error } = await getExtractedData(documentId)
// Returns: { document, fields[], fieldCount }
```

---

## Quick Commands

```bash
# Development
npm run dev                       # Start app (http://localhost:3000)
npm run supabase:start           # Start Supabase locally
npm run functions:serve          # Serve edge functions

# Deployment
npm run supabase:login           # Login to Supabase
npm run supabase:link            # Link to project
npm run functions:deploy         # Deploy all functions
deploy-functions.bat             # Windows deploy script

# Monitoring
npm run functions:logs           # View logs
supabase functions logs --tail   # Real-time logs
supabase functions list          # List deployed functions
```

---

## Edge Function URLs

**Production**:
- `https://lputifqvrradmfedheov.supabase.co/functions/v1/upload-document`
- `https://lputifqvrradmfedheov.supabase.co/functions/v1/process-document`
- `https://lputifqvrradmfedheov.supabase.co/functions/v1/get-extracted-data`

**Local**:
- `http://127.0.0.1:54321/functions/v1/upload-document`
- `http://127.0.0.1:54321/functions/v1/process-document`
- `http://127.0.0.1:54321/functions/v1/get-extracted-data`

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://lputifqvrradmfedheov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Functions (Supabase Secrets)
```bash
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://docext.cognitiveservices.azure.com/
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_API_KEY=your_key
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
supabase secrets set GEMINI_API_KEY=your_key
```

---

## File Structure

```
my-app/
├── app/
│   ├── auth/login/              # Login page
│   ├── auth/sign-up/            # Signup page  
│   ├── extract/                 # Upload & extract
│   ├── dashboard/               # View documents
│   └── document/[id]/           # Document details
├── lib/
│   ├── client.ts                # Supabase client
│   └── edge-functions.ts        # Edge function helpers
└── supabase/functions/
    ├── upload-document/         # Upload function
    ├── process-document/        # Process function
    └── get-extracted-data/      # Get data function
```

---

## Common Tasks

### Deploy Single Function
```bash
supabase functions deploy upload-document
supabase functions deploy process-document
supabase functions deploy get-extracted-data
```

### View Function Logs
```bash
supabase functions logs upload-document
supabase functions logs process-document
supabase functions logs get-extracted-data
```

### Set a Secret
```bash
supabase secrets set SECRET_NAME=secret_value
```

### List Secrets
```bash
supabase secrets list
```

### Delete a Function
```bash
supabase functions delete function-name
```

---

## Troubleshooting

**Function not found**
```bash
supabase functions deploy function-name
```

**Authentication error**
```bash
# Check session
const { data: { session } } = await supabase.auth.getSession()
console.log(session)
```

**Azure API error**
```bash
# Verify secrets
supabase secrets list
```

**Deployment fails**
```bash
# Check login
supabase login

# Check link
supabase link --project-ref lputifqvrradmfedheov
```

---

## Documentation

- `README_COMPLETE.md` - Complete overview
- `QUICKSTART.md` - Getting started
- `EDGE_FUNCTIONS.md` - API documentation
- `ARCHITECTURE.md` - Architecture diagrams
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist

---

## Support

**Test Locally**: `npm run functions:serve`  
**View Logs**: `npm run functions:logs`  
**Check Status**: `supabase functions list`

---

**Last Updated**: November 3, 2025
