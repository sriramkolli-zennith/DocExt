import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface FieldToExtract {
  name: string
  type?: string
  description?: string
}

interface ProcessRequest {
  documentId?: string
  documentName: string
  filePath: string
  publicUrl: string
  fieldsToExtract: (string | FieldToExtract)[]
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const requestStartTime = Date.now()
  console.log("========================================")
  console.log("🚀 Process Document Request Started")
  console.log("========================================")

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      console.error("❌ Missing authorization header")
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
      console.error("❌ Unauthorized user:", userError)
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("✅ User authenticated:", user.id)

    const { documentId, documentName, filePath, publicUrl, fieldsToExtract }: ProcessRequest = await req.json()

    console.log("📥 Request payload:")
    console.log("  - Document ID:", documentId || "New document")
    console.log("  - Document Name:", documentName)
    console.log("  - File Path:", filePath)
    console.log("  - Public URL:", publicUrl)
    console.log("  - Fields to Extract:", JSON.stringify(fieldsToExtract, null, 2))

    if (!filePath || !publicUrl || !fieldsToExtract || fieldsToExtract.length === 0) {
      console.error("❌ Missing required fields")
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Normalize fields to objects
    const normalizedFields = fieldsToExtract.map(field => 
      typeof field === 'string' 
        ? { name: field, type: 'text', description: `Auto-generated field for ${field}` }
        : { name: field.name, type: field.type || 'text', description: field.description || `Field: ${field.name}` }
    )

    console.log("📋 Normalized fields for extraction:")
    normalizedFields.forEach((field, idx) => {
      console.log(`  ${idx + 1}. Name: "${field.name}", Type: "${field.type}", Description: "${field.description}"`)
    })

    let docId = documentId
    if (!docId) {
      console.log("📝 Creating new document record...")
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
        console.error("❌ Document creation error:", docError)
        return new Response(
          JSON.stringify({ error: "Failed to create document record", details: docError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      docId = docData.id
      console.log("✅ Document created with ID:", docId)
      
      const fields = normalizedFields.map((field) => ({
        document_id: docId,
        name: field.name,
        type: field.type,
        description: field.description,
      }))

      console.log("💾 Inserting document fields into database...")
      const { error: fieldsError } = await supabaseClient.from("document_fields").insert(fields)
      
      if (fieldsError) {
        console.error("❌ Error inserting fields:", fieldsError)
      } else {
        console.log(`✅ ${fields.length} fields inserted successfully`)
      }
    } else {
      console.log("📝 Updating existing document:", docId)
      await supabaseClient.from("documents").update({ status: "processing" }).eq("id", docId)
      console.log("✅ Document status updated to 'processing'")
    }

    const azureEndpoint = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
    const azureKey = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_API_KEY")
    const modelId = "prebuilt-document"

    console.log("🔧 Azure Configuration:")
    console.log("  - Endpoint:", azureEndpoint ? "✅ Set" : "❌ Missing")
    console.log("  - API Key:", azureKey ? "✅ Set" : "❌ Missing")
    console.log("  - Model ID:", modelId)

    if (!azureEndpoint || !azureKey) {
      console.error("❌ Azure credentials not configured")
      await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
      return new Response(
        JSON.stringify({ error: "Azure credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const analysisUrl = `${azureEndpoint}/documentintelligence/documentModels/${modelId}:analyze?api-version=2024-02-29-preview`
    
    console.log("🌐 Calling Azure Document Intelligence...")
    console.log("  - URL:", analysisUrl)
    console.log("  - Document URL:", publicUrl)

    const azureResponse = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": azureKey, "Content-Type": "application/json" },
      body: JSON.stringify({ urlSource: publicUrl }),
    })

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text()
      console.error("❌ Azure API error:", azureResponse.status, errorText)
      await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
      throw new Error(`Azure API error: ${errorText}`)
    }

    console.log("✅ Azure analysis initiated")

    const operationLocation = azureResponse.headers.get("Operation-Location")
    if (!operationLocation) {
      console.error("❌ No operation location in response")
      throw new Error("No operation location")
    }

    console.log("⏳ Polling for analysis results...")
    console.log("  - Operation URL:", operationLocation)

    let analysisResult
    let attempts = 0
    const maxAttempts = 60

    while (attempts < maxAttempts) {
      const resultResponse = await fetch(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": azureKey },
      })

      const result = await resultResponse.json()
      console.log(`  📊 Attempt ${attempts + 1}/${maxAttempts} - Status: ${result.status}`)

      if (result.status === "succeeded") {
        analysisResult = result
        console.log("✅ Analysis completed successfully!")
        break
      }

      if (result.status === "failed") {
        console.error("❌ Azure analysis failed:", result.error)
        await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
        throw new Error("Azure analysis failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
    }

    if (!analysisResult) {
      console.error("❌ Analysis timeout after", maxAttempts, "attempts")
      await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
      throw new Error("Analysis timeout")
    }

    const extractedData = analysisResult.analyzeResult?.documents?.[0]?.fields || {}
    
    console.log("📤 Azure Response - Extracted Fields:")
    console.log("  Total fields found:", Object.keys(extractedData).length)
    Object.entries(extractedData).forEach(([key, value]: [string, any]) => {
      console.log(`  - ${key}:`, {
        value: value?.value || value?.content,
        confidence: value?.confidence,
        type: value?.type
      })
    })

    const { data: docFields } = await supabaseClient
      .from("document_fields")
      .select("id, name, type")
      .eq("document_id", docId)

    console.log("🔍 Fetched document fields from database:")
    console.log(`  Total fields in DB: ${docFields?.length || 0}`)
    docFields?.forEach((field, idx) => {
      console.log(`  ${idx + 1}. ID: ${field.id}, Name: "${field.name}", Type: "${field.type}"`)
    })

    // Helper function to find matching Azure field with intelligent matching
    const findAzureField = (requestedName: string): { fieldName: string; data: any; matchType: string } | null => {
      const normalizedRequest = requestedName.toLowerCase().replace(/[^a-z0-9]/g, '')
      
      // 1. Try exact match first
      if (extractedData[requestedName]) {
        return { fieldName: requestedName, data: extractedData[requestedName], matchType: 'exact' }
      }
      
      // 2. Try case-insensitive exact match
      const exactCaseInsensitive = Object.keys(extractedData).find(
        key => key.toLowerCase() === requestedName.toLowerCase()
      )
      if (exactCaseInsensitive) {
        return { fieldName: exactCaseInsensitive, data: extractedData[exactCaseInsensitive], matchType: 'case-insensitive' }
      }
      
      // 3. Try partial match using includes (from your sample: key.toLowerCase().includes(userField.name.toLowerCase()))
      const partialMatch = Object.keys(extractedData).find(key => 
        key.toLowerCase().includes(requestedName.toLowerCase()) ||
        requestedName.toLowerCase().includes(key.toLowerCase())
      )
      if (partialMatch) {
        return { fieldName: partialMatch, data: extractedData[partialMatch], matchType: 'partial' }
      }
      
      // 4. Try normalized match (remove special chars and compare)
      const normalizedMatch = Object.keys(extractedData).find(key => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
        return normalizedKey.includes(normalizedRequest) || normalizedRequest.includes(normalizedKey)
      })
      if (normalizedMatch) {
        return { fieldName: normalizedMatch, data: extractedData[normalizedMatch], matchType: 'normalized' }
      }
      
      // 5. Try fuzzy match by removing common prefixes
      const fuzzyMatch = Object.keys(extractedData).find(key => {
        const keyWithoutPrefix = key.replace(/^(Invoice|Customer|Vendor|Billing|Shipping|Total|Amount|Due)/i, '')
        const reqWithoutPrefix = requestedName.replace(/^(Invoice|Customer|Vendor|Billing|Shipping|Total|Amount|Due)/i, '')
        return keyWithoutPrefix.toLowerCase() === reqWithoutPrefix.toLowerCase()
      })
      if (fuzzyMatch) {
        return { fieldName: fuzzyMatch, data: extractedData[fuzzyMatch], matchType: 'fuzzy-prefix' }
      }
      
      return null
    }

    if (docFields) {
      console.log("🔗 Matching requested fields with Azure extracted fields:")
      const dataToSave = docFields
        .map((field: any) => {
          const matchResult = findAzureField(field.name)
          const azureField = matchResult?.data
          const matchedFieldName = matchResult?.fieldName
          const matchType = matchResult?.matchType || 'none'
          
          // Extract value using the same logic as your sample code
          let value = null
          if (azureField) {
            if (azureField.content) {
              value = azureField.content
            } else if (azureField.valueString) {
              value = azureField.valueString
            } else if (azureField.valueNumber !== undefined && azureField.valueNumber !== null) {
              value = azureField.valueNumber.toString()
            } else if (azureField.value) {
              value = azureField.value
            }
          }
          
          const confidence = azureField?.confidence || null
          
          // Extract bounding regions from Azure response
          let pageNumber = null
          let boundingBox = null
          if (azureField?.boundingRegions && azureField.boundingRegions.length > 0) {
            const firstRegion = azureField.boundingRegions[0]
            pageNumber = firstRegion.pageNumber
            boundingBox = firstRegion.polygon || firstRegion.boundingBox
          }
          
          console.log(`  "${field.name}" → ${matchedFieldName ? `"${matchedFieldName}" ✅ (${matchType})` : 'Not found ❌'}`)
          if (matchedFieldName && matchedFieldName !== field.name) {
            console.log(`    ℹ️  Matched using ${matchType} matching: "${field.name}" → "${matchedFieldName}"`)
          }
          if (value !== null) {
            console.log(`    📝 Value: "${value}" (confidence: ${confidence})`)
          }
          if (pageNumber && boundingBox) {
            console.log(`    📍 Location: Page ${pageNumber}, Bounding box: [${boundingBox.slice(0, 8).join(', ')}${boundingBox.length > 8 ? '...' : ''}]`)
          }
          
          return {
            document_id: docId,
            field_id: field.id,
            value: String(value || ''),
            confidence: confidence,
            pageNumber: pageNumber,
            boundingBox: boundingBox,
            found: matchResult !== null && value !== null
          }
        })

      console.log("💾 Preparing data to save:")
      dataToSave.forEach((data: any, idx: number) => {
        console.log(`  ${idx + 1}. Field ID: ${data.field_id}`)
        console.log(`     - Value: "${data.value}"`)
        console.log(`     - Confidence: ${data.confidence}`)
        console.log(`     - Page: ${data.pageNumber || 'N/A'}`)
        console.log(`     - Found in Azure: ${data.found ? '✅' : '❌'}`)
      })

      // Update document_fields with bounding box data
      for (const data of dataToSave) {
        if (data.pageNumber && data.boundingBox) {
          await supabaseClient
            .from("document_fields")
            .update({ 
              page_number: data.pageNumber, 
              bounding_box: data.boundingBox 
            })
            .eq("id", data.field_id)
        }
      }

      const fieldsToInsert = dataToSave.map(({ found, pageNumber, boundingBox, ...rest }: any) => rest)

      if (fieldsToInsert.length > 0) {
        console.log(`💾 Saving ${fieldsToInsert.length} field(s) to extracted_data table...`)
        const { error: saveError } = await supabaseClient
          .from("extracted_data")
          .upsert(fieldsToInsert, { onConflict: "document_id,field_id" })

        if (saveError) {
          console.error("❌ Error saving extracted data:", saveError)
        } else {
          console.log("✅ Extracted data saved successfully")
        }
      } else {
        console.log("⚠️  No data to save")
      }
    }

    console.log("🏁 Marking document as completed...")
    await supabaseClient
      .from("documents")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", docId)

    const totalTime = Date.now() - requestStartTime
    console.log("✅ Document processing completed successfully!")
    console.log(`⏱️  Total processing time: ${totalTime}ms`)
    console.log("========================================")

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId: docId, 
        message: "Document processed successfully",
        processingTime: totalTime,
        fieldsExtracted: Object.keys(extractedData).length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("========================================")
    console.error("❌ PROCESSING ERROR:")
    console.error(error)
    console.error("========================================")
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
