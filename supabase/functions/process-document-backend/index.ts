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
  originalFileName?: string
  fileHash?: string
  fieldsToExtract: FieldToExtract[]
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

    const { documentId, documentName, filePath, publicUrl, originalFileName, fileHash, fieldsToExtract }: ProcessRequest = await req.json()

    const normalizedOriginalFileName = originalFileName || (filePath ? filePath.split("/").pop() ?? null : null)
    let normalizedFileHash = fileHash ? fileHash.trim().toLowerCase() : null

    console.log("📥 Request payload:")
    console.log("  - Document ID:", documentId || "New document")
    console.log("  - Document Name:", documentName)
    console.log("  - File Path:", filePath)
    console.log("  - Public URL:", publicUrl)
    console.log("  - Original Filename:", normalizedOriginalFileName || "Not provided")
    console.log("  - File Hash:", normalizedFileHash || "Not provided")
    console.log("  - Fields to Extract:", JSON.stringify(fieldsToExtract, null, 2))

    if (!filePath || !publicUrl || !fieldsToExtract || fieldsToExtract.length === 0) {
      console.error("❌ Missing required fields")
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!normalizedFileHash) {
      try {
        console.log("⚠️ File hash not provided. Attempting to compute from public URL...")
        const fileResponse = await fetch(publicUrl)
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file for hashing: ${fileResponse.status}`)
        }
        const fileBuffer = await fileResponse.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer)
        normalizedFileHash = Array.from(new Uint8Array(hashBuffer))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")
        console.log("✅ Computed file hash from public URL")
      } catch (hashError) {
        console.warn("⚠️ Unable to compute file hash from public URL:", hashError)
      }
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

    if (normalizedFileHash) {
      const { data: existingDoc, error: duplicateError } = await supabaseClient
        .from("documents")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("file_hash", normalizedFileHash)
        .maybeSingle()

      if (duplicateError && duplicateError.code !== "PGRST116") {
        console.error("Error checking hash duplicates:", duplicateError)
      }

      if (existingDoc && (!documentId || existingDoc.id !== documentId)) {
        console.warn("Duplicate document upload detected", existingDoc.id)
        return new Response(
          JSON.stringify({
            error: "Document already uploaded",
            documentId: existingDoc.id,
            documentName: existingDoc.name,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    let docId = documentId
    if (!docId) {
      console.log("📝 Creating new document record...")
      const { data: docData, error: docError } = await supabaseClient
        .from("documents")
        .insert({
          user_id: user.id,
          name: documentName || "Untitled Document",
          storage_path: filePath,
          original_filename: normalizedOriginalFileName,
          file_hash: normalizedFileHash,
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
      const updatePayload: Record<string, unknown> = { status: "processing" }
      if (normalizedOriginalFileName) {
        updatePayload["original_filename"] = normalizedOriginalFileName
      }
      if (normalizedFileHash) {
        updatePayload["file_hash"] = normalizedFileHash
      }
      await supabaseClient.from("documents").update(updatePayload).eq("id", docId)
      console.log("✅ Document status updated to 'processing'")
    }

    const azureEndpoint = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
    const azureKey = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_API_KEY")
    const modelId = Deno.env.get("AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID") || "prebuilt-invoice"

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
        const errorDetails = JSON.stringify(result.error || result, null, 2)
        console.error("❌ Azure analysis failed:", errorDetails)
        await supabaseClient.from("documents").update({ status: "failed" }).eq("id", docId)
        throw new Error(`Azure analysis failed: ${errorDetails}`)
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
      const hasValueBounding = value?.boundingRegions && value.boundingRegions.length > 0
      const hasLabelBounding = value?.labelBoundingRegions && value.labelBoundingRegions.length > 0
      console.log(`  - ${key}:`, {
        value: value?.value || value?.content,
        confidence: value?.confidence,
        type: value?.type,
        hasValueBounding: hasValueBounding ? '✅' : '❌',
        hasLabelBounding: hasLabelBounding ? '✅' : '❌'
      })
      if (hasLabelBounding) {
        console.log(`    🔖 Label @ Page ${value.labelBoundingRegions[0].pageNumber}`)
      }
    })

    const { data: docFields } = await supabaseClient
      .from("document_fields")
      .select("id, name, type")
      .eq("document_id", docId)

    console.log("🔍 Fetched document fields from database:")
    console.log(`  Total fields in DB: ${docFields?.length || 0}`)
    docFields?.forEach((field: any, idx: number) => {
      console.log(`  ${idx + 1}. ID: ${field.id}, Name: "${field.name}", Type: "${field.type}"`)
    })

    // Helper function to calculate match score for Azure field matching
    const calculateMatchScore = (requestedName: string, azureFieldName: string): number => {
      const req = requestedName.toLowerCase()
      const azure = azureFieldName.toLowerCase()
      const normalizedReq = req.replace(/[^a-z0-9]/g, '')
      const normalizedAzure = azure.replace(/[^a-z0-9]/g, '')
      
      // 1. Exact match - highest score
      if (requestedName === azureFieldName) return 100
      
      // 2. Case-insensitive exact match
      if (req === azure) return 95
      
      // 3. Normalized exact match (no special chars)
      if (normalizedReq === normalizedAzure) return 90
      
      // 4. Contains relationship
      if (req.includes(azure) || azure.includes(req)) return 80
      if (normalizedReq.includes(normalizedAzure) || normalizedAzure.includes(normalizedReq)) return 75
      
      // 5. Fuzzy match by removing common prefixes
      const reqWithoutPrefix = req.replace(/^(invoice|customer|vendor|billing|shipping|total|amount|due|date|name|id|number|address|phone|email)/i, '')
      const azureWithoutPrefix = azure.replace(/^(invoice|customer|vendor|billing|shipping|total|amount|due|date|name|id|number|address|phone|email)/i, '')
      if (reqWithoutPrefix && azureWithoutPrefix && reqWithoutPrefix === azureWithoutPrefix) return 70
      
      // 6. Word overlap score
      const reqWords = req.split(/[\s_-]+/).filter(w => w.length > 2)
      const azureWords = azure.split(/[\s_-]+/).filter(w => w.length > 2)
      const commonWords = reqWords.filter(rw => azureWords.some(aw => aw.includes(rw) || rw.includes(aw)))
      if (commonWords.length > 0) {
        return 50 + (commonWords.length * 10)
      }
      
      return 0
    }

    // Helper function to find TOP 4 matching Azure fields with intelligent matching (1st is primary, next 3 are alternatives)
    const findTop4AzureFields = (requestedName: string): Array<{ fieldName: string; data: any; matchScore: number; matchType: string }> => {
      // Score all Azure fields
      const scoredFields = Object.entries(extractedData).map(([fieldName, fieldData]) => {
        const matchScore = calculateMatchScore(requestedName, fieldName)
        let matchType = 'none'
        
        if (matchScore >= 95) matchType = 'exact'
        else if (matchScore >= 80) matchType = 'contains'
        else if (matchScore >= 70) matchType = 'fuzzy'
        else if (matchScore >= 50) matchType = 'partial'
        
        return {
          fieldName,
          data: fieldData,
          matchScore,
          matchType
        }
      })
      
      // Sort by match score (descending) and take top 4
      return scoredFields
        .filter(f => f.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)
    }

    if (docFields) {
      console.log("🔗 Matching requested fields with Azure extracted fields (TOP 4):")
      const dataToSave = docFields
        .map((field: any) => {
          const top4Matches = findTop4AzureFields(field.name)
          
          // Helper to extract value from Azure field
          const extractValue = (azureField: any): string | null => {
            if (!azureField) return null
            if (azureField.content) return azureField.content
            if (azureField.valueString) return azureField.valueString
            if (azureField.valueNumber !== undefined && azureField.valueNumber !== null) {
              return azureField.valueNumber.toString()
            }
            if (azureField.value) return azureField.value
            return null
          }
          
          // Helper to extract bounding box data
          const extractBoundingData = (azureField: any) => {
            let pageNumber = null
            let boundingBox = null
            let labelPageNumber = null
            let labelBoundingBox = null
            
            if (azureField?.boundingRegions && azureField.boundingRegions.length > 0) {
              const firstRegion = azureField.boundingRegions[0]
              pageNumber = firstRegion.pageNumber
              const rawPolygon = firstRegion.polygon || firstRegion.boundingBox
              
              if (rawPolygon && typeof rawPolygon[0] === 'object' && rawPolygon[0].x !== undefined) {
                boundingBox = []
                for (const point of rawPolygon) {
                  boundingBox.push(point.x, point.y)
                }
              } else {
                boundingBox = rawPolygon
              }
            }
            
            if (azureField?.labelBoundingRegions && azureField.labelBoundingRegions.length > 0) {
              const firstLabelRegion = azureField.labelBoundingRegions[0]
              labelPageNumber = firstLabelRegion.pageNumber
              const rawLabelPolygon = firstLabelRegion.polygon || firstLabelRegion.boundingBox

              if (rawLabelPolygon && typeof rawLabelPolygon[0] === 'object' && rawLabelPolygon[0].x !== undefined) {
                labelBoundingBox = []
                for (const point of rawLabelPolygon) {
                  labelBoundingBox.push(point.x, point.y)
                }
              } else {
                labelBoundingBox = rawLabelPolygon
              }
            }
            
            return { pageNumber, boundingBox, labelPageNumber, labelBoundingBox }
          }
          
          // Process top 4 matches: first is primary, next 3 are alternatives
          const top3Values: string[] = []
          const top3Confidences: number[] = []
          const top3PageNumbers: (number | null)[] = []
          const top3BoundingBoxes: any[] = []
          const top3LabelPageNumbers: (number | null)[] = []
          const top3LabelBoundingBoxes: any[] = []
          
          // Best match (index 0) will be the primary value
          let bestValue = ''
          let bestConfidence = null
          let bestPageNumber = null
          let bestBoundingBox = null
          let bestLabelPageNumber = null
          let bestLabelBoundingBox = null
          
          console.log(`  "${field.name}" → Found ${top4Matches.length} match(es):`)
          
          top4Matches.forEach((match, index) => {
            const value = extractValue(match.data)
            const confidence = match.data?.confidence || null
            const boundingData = extractBoundingData(match.data)
            
            if (value) {
              // First match is the best match (primary value)
              if (index === 0) {
                bestValue = value
                bestConfidence = confidence
                bestPageNumber = boundingData.pageNumber
                bestBoundingBox = boundingData.boundingBox
                bestLabelPageNumber = boundingData.labelPageNumber
                bestLabelBoundingBox = boundingData.labelBoundingBox
              } else {
                // Indices 1-3 are the alternatives shown when user clicks thumbs down
                top3Values.push(value)
                top3Confidences.push(confidence || 0)
                top3PageNumbers.push(boundingData.pageNumber)
                top3BoundingBoxes.push(boundingData.boundingBox)
                top3LabelPageNumbers.push(boundingData.labelPageNumber)
                top3LabelBoundingBoxes.push(boundingData.labelBoundingBox)
              }
              
              console.log(`    ${index + 1}. "${match.fieldName}" = "${value}" ✅ (${match.matchType}, score: ${match.matchScore}, confidence: ${confidence ? (confidence * 100).toFixed(1) + '%' : 'N/A'})`)
              if (boundingData.pageNumber && boundingData.boundingBox) {
                console.log(`       📍 Value @ Page ${boundingData.pageNumber}`)
              }
              if (boundingData.labelPageNumber && boundingData.labelBoundingBox) {
                console.log(`       🔖 Label @ Page ${boundingData.labelPageNumber}`)
              }
            }
          })
          
          if (top4Matches.length === 0) {
            console.log(`    ❌ No matches found`)
          } else if (top4Matches.length === 1) {
            console.log(`    ⚠️  Only 1 match found - no alternatives available`)
          }
          
          return {
            document_id: docId,
            field_id: field.id,
            value: bestValue || 'Failed to Extract',
            confidence: bestConfidence,
            top3_values: top3Values,
            top3_confidences: top3Confidences,
            top3_page_numbers: top3PageNumbers,
            top3_bounding_boxes: top3BoundingBoxes,
            top3_label_page_numbers: top3LabelPageNumbers,
            top3_label_bounding_boxes: top3LabelBoundingBoxes,
            pageNumber: bestPageNumber,
            boundingBox: bestBoundingBox,
            labelPageNumber: bestLabelPageNumber,
            labelBoundingBox: bestLabelBoundingBox,
            found: top4Matches.length > 0 && bestValue !== ''
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
        const updatePayload: Record<string, unknown> = {}
        if (data.pageNumber && data.boundingBox) {
          updatePayload.page_number = data.pageNumber
          updatePayload.bounding_box = data.boundingBox
        }
        if (data.labelPageNumber && data.labelBoundingBox) {
          updatePayload.label_page_number = data.labelPageNumber
          updatePayload.label_bounding_box = data.labelBoundingBox
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabaseClient
            .from("document_fields")
            .update(updatePayload)
            .eq("id", data.field_id)
        }
      }

      const fieldsToInsert = dataToSave.map(({ found, pageNumber, boundingBox, labelPageNumber, labelBoundingBox, ...rest }: any) => rest)

      if (fieldsToInsert.length > 0) {
        console.log(`💾 Saving ${fieldsToInsert.length} field(s) to extracted_data table (with top 3 values)...`)
        
        // Log what we're saving
        fieldsToInsert.forEach((item: any, idx: number) => {
          console.log(`  ${idx + 1}. Field ID: ${item.field_id}`)
          console.log(`     - Primary Value: "${item.value}"`)
          console.log(`     - Confidence: ${item.confidence}`)
          console.log(`     - Top 3 Values: [${item.top3_values.map((v: string) => `"${v}"`).join(', ')}]`)
          console.log(`     - Top 3 Confidences: [${item.top3_confidences.map((c: number) => `${(c * 100).toFixed(1)}%`).join(', ')}]`)
        })
        
        const { error: saveError } = await supabaseClient
          .from("extracted_data")
          .upsert(fieldsToInsert, { onConflict: "document_id,field_id" })

        if (saveError) {
          console.error("❌ Error saving extracted data:", saveError)
          console.error("Error details:", JSON.stringify(saveError, null, 2))
        } else {
          console.log("✅ Extracted data saved successfully with top 3 alternatives")
        }
      } else {
        console.log("⚠️  No data to save")
      }

      // Generate field-specific recommendations for unextracted fields
      console.log("💡 Generating field-specific recommendations for missing fields...")
      
      // Helper to calculate semantic similarity score
      const calculateRelevanceScore = (requestedField: string, azureField: string): number => {
        const req = requestedField.toLowerCase()
        const azure = azureField.toLowerCase()
        
        // Exact match
        if (req === azure) return 100
        
        // Contains relationship
        if (req.includes(azure) || azure.includes(req)) return 80
        
        // Common field patterns and relationships
        const fieldRelationships: Record<string, string[]> = {
          'invoiceid': ['invoicenumber', 'documentnumber', 'billnumber', 'referencenumber'],
          'invoicedate': ['date', 'issuedate', 'billdate', 'duedate'],
          'vendorname': ['vendor', 'supplier', 'sellername', 'merchantname', 'customername'],
          'total': ['totalamount', 'amountdue', 'totalprice', 'grandtotal', 'invoicetotal'],
          'amount': ['total', 'subtotal', 'balance', 'price'],
          'tax': ['salestax', 'vat', 'taxamount', 'taxtotal'],
          'address': ['billingaddress', 'shippingaddress', 'customeraddress', 'vendoraddress'],
          'phone': ['phonenumber', 'telephone', 'mobile', 'contact'],
          'email': ['emailaddress', 'contactemail'],
          'description': ['itemdescription', 'productdescription', 'details'],
          'quantity': ['qty', 'amount', 'count'],
          'price': ['unitprice', 'amount', 'cost'],
          'customer': ['customername', 'clientname', 'buyer', 'purchaser'],
          'po': ['purchaseorder', 'ponumber', 'ordernumber'],
          'payment': ['paymentterms', 'paymentmethod', 'duedate']
        }
        
        // Check field relationships
        const normalizedReq = req.replace(/[^a-z0-9]/g, '')
        const normalizedAzure = azure.replace(/[^a-z0-9]/g, '')
        
        for (const [key, relatedFields] of Object.entries(fieldRelationships)) {
          if (normalizedReq.includes(key)) {
            if (relatedFields.some(rf => normalizedAzure.includes(rf))) return 70
          }
        }
        
        // Word overlap
        const reqWords = req.split(/[\s_-]+/)
        const azureWords = azure.split(/[\s_-]+/)
        const overlap = reqWords.filter(w => azureWords.some(aw => aw.includes(w) || w.includes(aw)))
        if (overlap.length > 0) return 50 + (overlap.length * 10)
        
        return 0
      }
      
      // Get available Azure fields (not already matched)
      const extractedFieldNames = new Set(
        docFields
          .filter((f: any) => dataToSave.find((d: any) => d.field_id === f.id && d.found))
          .map((f: any) => f.name.toLowerCase())
      )
      
      const availableAzureFields = Object.entries(extractedData)
        .filter(([fieldName, fieldData]: [string, any]) => {
          // Check if already extracted
          const isAlreadyExtracted = extractedFieldNames.has(fieldName.toLowerCase())
          
          // Extract value
          const fieldDataTyped = fieldData as any
          let value = null
          if (fieldDataTyped.content) value = fieldDataTyped.content
          else if (fieldDataTyped.valueString) value = fieldDataTyped.valueString
          else if (fieldDataTyped.valueNumber !== undefined) value = fieldDataTyped.valueNumber.toString()
          else if (fieldDataTyped.value) value = fieldDataTyped.value
          
          const confidence = fieldDataTyped.confidence || 0
          return !isAlreadyExtracted && value && confidence >= 0.4
        })
        .map(([fieldName, fieldData]: [string, any]) => {
          const fieldDataTyped = fieldData as any
          
          // Extract value
          let value = null
          if (fieldDataTyped.content) value = fieldDataTyped.content
          else if (fieldDataTyped.valueString) value = fieldDataTyped.valueString
          else if (fieldDataTyped.valueNumber !== undefined) value = fieldDataTyped.valueNumber.toString()
          else if (fieldDataTyped.value) value = fieldDataTyped.value
          
          // Extract bounding regions
          let pageNumber = null
          let boundingBox = null
          let labelPageNumber = null
          let labelBoundingBox = null
          
          if (fieldDataTyped.boundingRegions && fieldDataTyped.boundingRegions.length > 0) {
            const firstRegion = fieldDataTyped.boundingRegions[0]
            pageNumber = firstRegion.pageNumber
            const rawPolygon = firstRegion.polygon || firstRegion.boundingBox
            
            if (rawPolygon && typeof rawPolygon[0] === 'object' && rawPolygon[0].x !== undefined) {
              boundingBox = []
              for (const point of rawPolygon) {
                boundingBox.push(point.x, point.y)
              }
            } else {
              boundingBox = rawPolygon
            }
          }
          
          if (fieldDataTyped.labelBoundingRegions && fieldDataTyped.labelBoundingRegions.length > 0) {
            const firstLabelRegion = fieldDataTyped.labelBoundingRegions[0]
            labelPageNumber = firstLabelRegion.pageNumber
            const rawLabelPolygon = firstLabelRegion.polygon || firstLabelRegion.boundingBox

            if (rawLabelPolygon && typeof rawLabelPolygon[0] === 'object' && rawLabelPolygon[0].x !== undefined) {
              labelBoundingBox = []
              for (const point of rawLabelPolygon) {
                labelBoundingBox.push(point.x, point.y)
              }
            } else {
              labelBoundingBox = rawLabelPolygon
            }
          }
          
          return {
            fieldName,
            value: String(value || ''),
            confidence: fieldDataTyped.confidence || 0,
            type: fieldDataTyped.type || 'text',
            pageNumber,
            boundingBox,
            labelPageNumber,
            labelBoundingBox
          }
        })
      
      // For each missing field, find top 3 contextually relevant recommendations
      const allRecommendations: any[] = []
      
      for (const field of docFields) {
        const isFieldExtracted = dataToSave.find((d: any) => d.field_id === field.id && d.found)
        
        if (!isFieldExtracted) {
          console.log(`💡 Finding recommendations for missing field: "${field.name}"`)
          
          // Score and rank available fields by relevance
          const scoredFields = availableAzureFields.map(azureField => ({
            ...azureField,
            relevanceScore: calculateRelevanceScore(field.name, azureField.fieldName),
            // Combined score: relevance * confidence
            combinedScore: calculateRelevanceScore(field.name, azureField.fieldName) * azureField.confidence
          }))
          
          // Sort by combined score and take top 3
          const topRecommendations = scoredFields
            .filter(f => f.combinedScore > 0)
            .sort((a, b) => b.combinedScore - a.combinedScore)
            .slice(0, 3)
          
          if (topRecommendations.length > 0) {
            console.log(`  Found ${topRecommendations.length} contextual recommendation(s):`)
            
            topRecommendations.forEach((rec, index) => {
              console.log(`    ${index + 1}. "${rec.fieldName}" = "${rec.value}" (relevance: ${rec.relevanceScore}%, confidence: ${(rec.confidence * 100).toFixed(1)}%)`)
              
              allRecommendations.push({
                document_id: docId,
                missing_field_id: field.id,
                missing_field_name: field.name,
                recommended_field_name: rec.fieldName,
                field_value: rec.value,
                confidence: rec.confidence,
                relevance_score: rec.relevanceScore,
                field_type: rec.type,
                page_number: rec.pageNumber,
                bounding_box: rec.boundingBox,
                label_page_number: rec.labelPageNumber,
                label_bounding_box: rec.labelBoundingBox,
                rank: index + 1
              })
            })
          } else {
            console.log(`  ⚠️  No contextual recommendations found`)
          }
        }
      }
      
      if (allRecommendations.length > 0) {
        console.log(`💾 Saving ${allRecommendations.length} field-specific recommendation(s)...`)
        
        const { error: recError } = await supabaseClient
          .from("field_recommendations")
          .upsert(allRecommendations, { onConflict: "document_id,missing_field_id,recommended_field_name" })
        
        if (recError) {
          console.error("❌ Error saving recommendations:", recError)
        } else {
          console.log("✅ Field-specific recommendations saved successfully")
        }
      } else {
        console.log("⚠️  No recommendations needed - all fields extracted successfully")
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
