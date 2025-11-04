# Supabase Edge Functions Deployment Guide

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref lputifqvrradmfedheov
```

## Set Edge Function Secrets

Before deploying, set the required secrets for the edge function:

```bash
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=<your-azure-endpoint>
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_API_KEY=<your-azure-api-key>
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```

## Deploy the Edge Function

Deploy the extract function:

```bash
supabase functions deploy extract
```

## Test the Edge Function Locally

Run the function locally for testing:

```bash
supabase start
supabase functions serve extract --env-file supabase/.env.local
```

Test with curl:

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

## Edge Function URL

After deployment, your function will be available at:
```
https://lputifqvrradmfedheov.supabase.co/functions/v1/extract
```

## Verify Deployment

List deployed functions:
```bash
supabase functions list
```

View function logs:
```bash
supabase functions logs extract
```
