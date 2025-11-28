import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface ReExtractRequest {
  documentId: string
  fieldId: string
  fieldName: string
  fieldType: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  console.log("========================================")
  console.log("🔄 Re-extract Single Field Request Started")
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

    const { documentId, fieldId, fieldName, fieldType }: ReExtractRequest = await req.json()

    console.log("📥 Request payload:")
    console.log("  - Document ID:", documentId)
    console.log("  - Field ID:", fieldId)
    console.log("  - New Field Name:", fieldName)
    console.log("  - New Field Type:", fieldType)

    if (!documentId || !fieldId || !fieldName || !fieldType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabaseClient
      .from("documents")
      .select("id, storage_path")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      console.error("❌ Document not found:", docError)
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("📄 Document verified:", document.id)

    // Get public URL for the document
    const { data: { publicUrl } } = supabaseClient.storage
      .from("documents")
      .getPublicUrl(document.storage_path)

    console.log("🔗 Document URL:", publicUrl)

    // Update document_fields table with new name and type
    const { error: updateFieldError } = await supabaseClient
      .from("document_fields")
      .update({
        name: fieldName,
        type: fieldType,
      })
      .eq("id", fieldId)
      .eq("document_id", documentId)

    if (updateFieldError) {
      console.error("❌ Failed to update field:", updateFieldError)
      return new Response(
        JSON.stringify({ error: "Failed to update field" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("✅ Field metadata updated in database")

    // Call Azure Document Intelligence API
    const azureEndpoint = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
    const azureKey = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_API_KEY")
    const modelId = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID") || "prebuilt-invoice"

    if (!azureEndpoint || !azureKey) {
      console.error("❌ Azure credentials not configured")
      return new Response(
        JSON.stringify({ error: "Azure credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("🔍 Calling Azure Document Intelligence API...")
    console.log(`📋 Using model: ${modelId}`)
    
    const analyzeUrl = `${azureEndpoint}/documentintelligence/documentModels/${modelId}:analyze?api-version=2024-11-30`
    
    const analyzeResponse = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": azureKey,
      },
      body: JSON.stringify({
        urlSource: publicUrl,
      }),
    })

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text()
      console.error("❌ Azure API error:", errorText)
      return new Response(
        JSON.stringify({ error: "Failed to analyze document with Azure" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const operationLocation = analyzeResponse.headers.get("Operation-Location")
    if (!operationLocation) {
      console.error("❌ No operation location returned")
      return new Response(
        JSON.stringify({ error: "Azure analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("⏳ Polling for Azure analysis results...")

    let analysisComplete = false
    let azureResult: any = null
    let pollAttempts = 0
    const maxPollAttempts = 30

    while (!analysisComplete && pollAttempts < maxPollAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      pollAttempts++

      const resultResponse = await fetch(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
        },
      })

      const result = await resultResponse.json()

      if (result.status === "succeeded") {
        analysisComplete = true
        azureResult = result
        console.log("✅ Azure analysis completed successfully")
      } else if (result.status === "failed") {
        console.error("❌ Azure analysis failed:", result)
        return new Response(
          JSON.stringify({ error: "Azure analysis failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    if (!analysisComplete || !azureResult) {
      console.error("❌ Azure analysis timeout")
      return new Response(
        JSON.stringify({ error: "Azure analysis timeout" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Extract fields from Azure result
    const azureFields = azureResult.analyzeResult?.documents?.[0]?.fields || {}
    console.log("📊 Azure extracted fields count:", Object.keys(azureFields).length)

    // Helper function to calculate match score
    const calculateMatchScore = (requestedName: string, azureFieldName: string): number => {
      const req = requestedName.toLowerCase()
      const azure = azureFieldName.toLowerCase()
      const normalizedReq = req.replace(/[^a-z0-9]/g, '')
      const normalizedAzure = azure.replace(/[^a-z0-9]/g, '')
      
      if (requestedName === azureFieldName) return 100
      if (req === azure) return 95
      if (normalizedReq === normalizedAzure) return 90
      if (req.includes(azure) || azure.includes(req)) return 80
      if (normalizedReq.includes(normalizedAzure) || normalizedAzure.includes(normalizedReq)) return 75
      
      const reqWords = req.split(/\s+/)
      const azureWords = azure.split(/\s+/)
      const commonWords = reqWords.filter(w => azureWords.includes(w)).length
      if (commonWords > 0) return 50 + (commonWords * 10)
      
      return 0
    }

    // Find top 4 matching fields
    const matches: any[] = []
    
    Object.entries(azureFields).forEach(([azureFieldName, fieldData]: [string, any]) => {
      if (!fieldData?.content) return
      
      const matchScore = calculateMatchScore(fieldName, azureFieldName)
      if (matchScore < 50) return

      const valueBoundingRegions = fieldData.boundingRegions || []
      const labelBoundingRegions = fieldData.labelBoundingRegions || []

      matches.push({
        azureFieldName,
        matchScore,
        value: fieldData.content,
        confidence: fieldData.confidence || 0,
        valueBoundingRegions,
        labelBoundingRegions,
      })
    })

    matches.sort((a, b) => b.matchScore - a.matchScore)
    const top4Matches = matches.slice(0, 4)

    console.log(`🎯 Found ${top4Matches.length} top matches for "${fieldName}"`)

    if (top4Matches.length === 0) {
      console.warn("⚠️ No matching fields found")
      
      // Reset the extracted_data with empty values and reset feedback count
      await supabaseClient
        .from("extracted_data")
        .upsert({
          document_id: documentId,
          field_id: fieldId,
          value: 'Failed to Extract',
          confidence: null,
          top3_values: [],
          top3_confidences: [],
          top3_page_numbers: [],
          top3_bounding_boxes: [],
          top3_label_page_numbers: [],
          top3_label_bounding_boxes: [],
          user_feedback: null,
          is_manually_selected: false,
          selected_from_top3_index: null,
          feedback_attempt_count: 0,
          feedback_timestamp: null,
        }, {
          onConflict: "document_id,field_id"
        })

      return new Response(
        JSON.stringify({
          message: "Field updated but no matching values found in document",
          fieldId,
          fieldName,
          fieldType,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Prepare top4 data
    const top4Values = top4Matches.map(m => m.value)
    const top4Confidences = top4Matches.map(m => m.confidence)
    const top4PageNumbers = top4Matches.map(m => m.valueBoundingRegions[0]?.pageNumber || 1)
    const top4BoundingBoxes = top4Matches.map(m => 
      m.valueBoundingRegions[0]?.polygon || []
    )
    const top4LabelPageNumbers = top4Matches.map(m => 
      m.labelBoundingRegions[0]?.pageNumber || null
    )
    const top4LabelBoundingBoxes = top4Matches.map(m => 
      m.labelBoundingRegions[0]?.polygon || null
    )

    // Use the first (best) match as the primary value
    const bestMatch = top4Matches[0]
    const primaryPageNumber = bestMatch.valueBoundingRegions[0]?.pageNumber || 1
    const primaryBoundingBox = bestMatch.valueBoundingRegions[0]?.polygon || []
    const primaryLabelPageNumber = bestMatch.labelBoundingRegions[0]?.pageNumber || null
    const primaryLabelBoundingBox = bestMatch.labelBoundingRegions[0]?.polygon || null

    // Update document_fields with primary bounding box
    await supabaseClient
      .from("document_fields")
      .update({
        page_number: primaryPageNumber,
        bounding_box: primaryBoundingBox,
        label_page_number: primaryLabelPageNumber,
        label_bounding_box: primaryLabelBoundingBox,
      })
      .eq("id", fieldId)

    // Update extracted_data with new values and reset feedback count to 0
    const { error: upsertError } = await supabaseClient
      .from("extracted_data")
      .upsert({
        document_id: documentId,
        field_id: fieldId,
        value: bestMatch.value,
        confidence: bestMatch.confidence,
        top3_values: top4Values,
        top3_confidences: top4Confidences,
        top3_page_numbers: top4PageNumbers,
        top3_bounding_boxes: top4BoundingBoxes,
        top3_label_page_numbers: top4LabelPageNumbers,
        top3_label_bounding_boxes: top4LabelBoundingBoxes,
        user_feedback: null,
        is_manually_selected: false,
        selected_from_top3_index: null,
        feedback_attempt_count: 0,
        feedback_timestamp: null,
      }, {
        onConflict: "document_id,field_id"
      })

    if (upsertError) {
      console.error("❌ Failed to update extracted data:", upsertError)
      return new Response(
        JSON.stringify({ error: "Failed to save extraction results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("✅ Re-extraction completed successfully")
    console.log("  - Extracted value:", bestMatch.value)
    console.log("  - Confidence:", (bestMatch.confidence * 100).toFixed(1) + "%")
    console.log("  - Alternatives:", top4Values.length - 1)
    console.log("========================================")

    return new Response(
      JSON.stringify({
        message: "Field re-extracted successfully",
        fieldId,
        fieldName,
        fieldType,
        value: bestMatch.value,
        confidence: bestMatch.confidence,
        alternativesCount: top4Values.length - 1,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("❌ Re-extraction error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to re-extract field" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
