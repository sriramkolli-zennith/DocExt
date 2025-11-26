import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface GetDataRequest {
  documentId: string
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

    const { documentId }: GetDataRequest = await req.json()

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Missing documentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: document, error: docError } = await supabaseClient
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: extractedData, error: dataError } = await supabaseClient
      .from("extracted_data")
      .select(`
        id,
        value,
        confidence,
        top3_values,
        top3_confidences,
        top3_page_numbers,
        top3_bounding_boxes,
        top3_label_page_numbers,
        top3_label_bounding_boxes,
        user_feedback,
        is_manually_selected,
        selected_from_top3_index,
        feedback_timestamp,
        document_fields (
          id,
          name,
          type,
          description,
          page_number,
          bounding_box,
          label_page_number,
          label_bounding_box
        )
      `)
      .eq("document_id", documentId)
      .order("id", { ascending: true })

    if (dataError) {
      console.error("Data fetch error:", dataError)
      return new Response(
        JSON.stringify({ error: "Failed to fetch extracted data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const formattedData = extractedData?.map((item) => ({
      id: item.id,
      fieldId: item.document_fields.id,
      fieldName: item.document_fields.name,
      fieldType: item.document_fields.type,
      fieldDescription: item.document_fields.description,
      value: item.value,
      confidence: item.confidence,
      // Top 3 alternatives
      top3Values: item.top3_values || [],
      top3Confidences: item.top3_confidences || [],
      top3PageNumbers: item.top3_page_numbers || [],
      top3BoundingBoxes: item.top3_bounding_boxes || [],
      top3LabelPageNumbers: item.top3_label_page_numbers || [],
      top3LabelBoundingBoxes: item.top3_label_bounding_boxes || [],
      // User feedback
      userFeedback: item.user_feedback,
      isManuallySelected: item.is_manually_selected,
      selectedFromTop3Index: item.selected_from_top3_index,
      feedbackTimestamp: item.feedback_timestamp,
      // Bounding box data from document_fields
      pageNumber: item.document_fields.page_number,
      boundingBox: item.document_fields.bounding_box,
      labelPageNumber: item.document_fields.label_page_number,
      labelBoundingBox: item.document_fields.label_bounding_box,
    })) || []

    return new Response(
      JSON.stringify({
        document: {
          id: document.id,
          name: document.name,
          storagePath: document.storage_path,
          originalFilename: document.original_filename,
          status: document.status,
          createdAt: document.created_at,
          processedAt: document.processed_at,
        },
        extractedFields: formattedData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Get data error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to get data" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
