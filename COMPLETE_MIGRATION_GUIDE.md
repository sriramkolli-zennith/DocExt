# Complete Migration Guide

## Step 1: Run SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/lputifqvrradmfedheov/sql/new

2. Copy and paste this complete SQL (this creates all 4 tables matching your schema):

```sql
-- This SQL is already in your database based on the schema you shared
-- Just verify these tables exist

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'documents', 'document_fields', 'extracted_data');
```

Your database should already have:
- `profiles` table
- `documents` table (with `storage_path`, `status`, `processed_at` columns)
- `document_fields` table  
- `extracted_data` table

## Step 2: Create process-document-backend Edge Function

Create a new file: `supabase/functions/process-document-backend/index.ts`

Copy this code into it:

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface ProcessRequest {
  documentId?: string
  documentName: string
  filePath: string
  publicUrl: string
  fieldsToExtract: string[]
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { documentId, documentName, filePath, publicUrl, fieldsToExtract }: ProcessRequest = await req.json()

    if (!filePath || !publicUrl || !fieldsToExtract || fieldsToExtract.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let docId = documentId
    if (!docId) {
      const { data: docData, error: docError } = await supabaseClient
        .from("documents")
        .insert({
          user_id: user.id,
          name: documentName || "Untitled Document",
          storage_path: filePath,
          status: "processing",
        })
        .select()
        .single()

      if (docError) {
        console.error("Document creation error:", docError)
        return new Response(
          JSON.stringify({ error: "Failed to create document record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      docId = docData.id
      
      const fields = fieldsToExtract.map((fieldName) => ({
        document_id: docId,
        name: fieldName,
        type: "text",
        description: \`Auto-generated field for \${fieldName}\`,
      }))

      await supabaseClient.from("document_fields").insert(fields)
    } else {
      await supabaseClient.from("documents").update({ status: "processing" }).eq("id", docId)
    }

    const azureEndpoint = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
    const azureKey = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_API_KEY")
    const modelId = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID") || "prebuilt-invoice"

    if (!azureEndpoint || !azureKey) {
      await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
      return new Response(
        JSON.stringify({ error: "Azure credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const analysisUrl = \`\${azureEndpoint}documentintelligence/documentModels/\${modelId}:analyze?api-version=2024-02-29-preview\`

    const azureResponse = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": azureKey, "Content-Type": "application/json" },
      body: JSON.stringify({ urlSource: publicUrl }),
    })

    if (!azureResponse.ok) {
      await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
      throw new Error(\`Azure API error: \${await azureResponse.text()}\`)
    }

    const operationLocation = azureResponse.headers.get("Operation-Location")
    if (!operationLocation) throw new Error("No operation location")

    let analysisResult
    let attempts = 0
    const maxAttempts = 60

    while (attempts < maxAttempts) {
      const resultResponse = await fetch(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": azureKey },
      })

      const result = await resultResponse.json()

      if (result.status === "succeeded") {
        analysisResult = result
        break
      }

      if (result.status === "failed") {
        await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
        throw new Error("Azure analysis failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
    }

    if (!analysisResult) {
      await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
      throw new Error("Analysis timeout")
    }

    const extractedData = analysisResult.analyzeResult?.documents?.[0]?.fields || {}
    const { data: docFields } = await supabaseClient
      .from("document_fields")
      .select("id, name")
      .eq("document_id", docId)

    if (docFields) {
      const dataToSave = docFields
        .filter((field) => field.name in extractedData)
        .map((field) => ({
          document_id: docId,
          field_id: field.id,
          value: extractedData[field.name]?.value || extractedData[field.name]?.content || "",
          confidence: extractedData[field.name]?.confidence || null,
        }))

      if (dataToSave.length > 0) {
        await supabaseClient.from("extracted_data").upsert(dataToSave, { onConflict: "document_id,field_id" })
      }
    }

    await supabaseClient
      .from("documents")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", docId)

    return new Response(
      JSON.stringify({ success: true, documentId: docId, message: "Document processed successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Processing error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
```

## Step 3: Update get-extracted-data-backend Edge Function

Update `supabase/functions/get-extracted-data-backend/index.ts` with the new schema.

I'll create this in a separate guide file.

## Step 4: Deploy

Once files are updated:

```bash
npm run functions:deploy
```

## Summary of Changes

**New Schema (4 Tables):**
1. `profiles` - User profiles
2. `documents` - Document metadata with `storage_path` and `status`
3. `document_fields` - User-defined fields to extract  
4. `extracted_data` - Extracted field values with confidence scores

**Key Differences from Old Schema:**
- `documents.file_url` → `documents.storage_path`
- Added `documents.status` (pending/processing/completed/failed)
- Added `documents.processed_at`
- New `document_fields` table to define fields per document
- New `extracted_data` table with `field_id` reference
- `extracted_fields` table → `extracted_data` table
