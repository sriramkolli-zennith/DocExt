# Supabase Edge Functions Migration

This project has been migrated from Next.js API routes to Supabase Edge Functions.

## What Changed

### Before
- Backend logic was in `api/extract/route.ts` (Next.js API route)
- Called using `/api/extract` endpoint
- Required Next.js server deployment

### After
- Backend logic is now in `supabase/functions/extract/index.ts` (Deno Edge Function)
- Called using Supabase Edge Functions endpoint
- Deployed independently to Supabase
- Scales automatically with Supabase infrastructure

## Project Structure

```
my-app/
├── supabase/
│   ├── functions/
│   │   ├── extract/
│   │   │   └── index.ts          # Document extraction edge function
│   │   └── _shared/
│   │       └── cors.ts            # Shared CORS headers
│   ├── config.toml                # Supabase configuration
│   ├── .env.local                 # Local edge function secrets
│   └── DEPLOYMENT.md              # Deployment instructions
├── lib/
│   └── edge-functions.ts          # Helper to call edge functions
└── app/
    └── extract/
        └── page.tsx               # Updated to call edge function
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://lputifqvrradmfedheov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=<your-azure-endpoint>
AZURE_DOCUMENT_INTELLIGENCE_API_KEY=...
AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
GEMINI_API_KEY=...
```

### Edge Function Secrets (Supabase)
Set these using Supabase CLI:
```bash
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=...
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_API_KEY=...
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
supabase secrets set GEMINI_API_KEY=...
```

## Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
supabase link --project-ref lputifqvrradmfedheov
```

### 4. Set Edge Function Secrets
```bash
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=<your-azure-endpoint>
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_API_KEY=<your-azure-api-key>
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```

### 5. Deploy Edge Functions
```bash
npm run deploy:functions
```

Or deploy individually:
```bash
supabase functions deploy extract
```

## Local Development

### Run Edge Functions Locally
```bash
# Start Supabase local development
supabase start

# Serve the extract function
supabase functions serve extract --env-file supabase/.env.local
```

The function will be available at:
```
http://127.0.0.1:54321/functions/v1/extract
```

### Test Locally
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/extract' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "documentId": "test-id",
    "fileUrl": "https://example.com/document.pdf",
    "fieldsToExtract": ["InvoiceId", "VendorName", "InvoiceTotal"]
  }'
```

## Production Deployment

After deploying the edge function, it will be available at:
```
https://lputifqvrradmfedheov.supabase.co/functions/v1/extract
```

The frontend automatically uses this URL when calling `callEdgeFunction()`.

## Monitoring

### View Function Logs
```bash
supabase functions logs extract
```

### List Deployed Functions
```bash
supabase functions list
```

## Benefits of Edge Functions

1. **Serverless**: No server management required
2. **Auto-scaling**: Scales automatically with demand
3. **Global**: Runs on Supabase's global edge network
4. **Secure**: Secrets managed by Supabase
5. **Fast**: Low latency with edge deployment
6. **Cost-effective**: Pay only for what you use

## Helper Function

Use the `callEdgeFunction` helper to call any edge function:

```typescript
import { callEdgeFunction } from "@/lib/edge-functions"

const { data, error } = await callEdgeFunction("extract", {
  documentId: "doc-123",
  fileUrl: "https://...",
  fieldsToExtract: ["field1", "field2"]
})

if (error) {
  console.error(error)
} else {
  console.log(data)
}
```

## Troubleshooting

### Function not found
Make sure you've deployed the function:
```bash
supabase functions deploy extract
```

### Authentication errors
Ensure you're passing the session token in the Authorization header. The `callEdgeFunction` helper handles this automatically.

### Secrets not available
Set secrets using:
```bash
supabase secrets set SECRET_NAME=secret_value
```

View current secrets:
```bash
supabase secrets list
```
