import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface FeedbackRequest {
  extractedDataId: string
  action: 'thumbs_up' | 'thumbs_down' | 'select_from_top3'
  selectedIndex?: number  // 0, 1, or 2 for selecting from top 3
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  console.log("========================================")
  console.log("🔄 Update Field Feedback Request Started")
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

    const { extractedDataId, action, selectedIndex }: FeedbackRequest = await req.json()

    console.log("📥 Request payload:")
    console.log("  - Extracted Data ID:", extractedDataId)
    console.log("  - Action:", action)
    console.log("  - Selected Index:", selectedIndex)

    if (!extractedDataId || !action) {
      console.error("❌ Missing required fields")
      return new Response(
        JSON.stringify({ error: "Missing extractedDataId or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Validate action
    if (!['thumbs_up', 'thumbs_down', 'select_from_top3'].includes(action)) {
      console.error("❌ Invalid action:", action)
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be thumbs_up, thumbs_down, or select_from_top3" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // For select_from_top3, validate selectedIndex
    if (action === 'select_from_top3') {
      if (selectedIndex === undefined || selectedIndex === null) {
        console.error("❌ Missing selectedIndex for select_from_top3 action")
        return new Response(
          JSON.stringify({ error: "selectedIndex is required for select_from_top3 action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
      if (![0, 1, 2].includes(selectedIndex)) {
        console.error("❌ Invalid selectedIndex:", selectedIndex)
        return new Response(
          JSON.stringify({ error: "selectedIndex must be 0, 1, or 2" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    // Fetch current extracted data to verify ownership and get top3 data
    const { data: currentData, error: fetchError } = await supabaseClient
      .from("extracted_data")
      .select(`
        id,
        value,
        field_id,
        top3_values,
        top3_confidences,
        top3_page_numbers,
        top3_bounding_boxes,
        top3_label_page_numbers,
        top3_label_bounding_boxes,
        document_id,
        documents!inner(user_id)
      `)
      .eq("id", extractedDataId)
      .single()

    if (fetchError || !currentData) {
      console.error("❌ Extracted data not found:", fetchError)
      return new Response(
        JSON.stringify({ error: "Extracted data not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Verify ownership
    if (currentData.documents.user_id !== user.id) {
      console.error("❌ User does not own this document")
      return new Response(
        JSON.stringify({ error: "Unauthorized access to this document" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("📊 Current data:")
    console.log("  - Current value:", currentData.value)
    console.log("  - Top 3 values:", currentData.top3_values)

    let updateData: any = {
      feedback_timestamp: new Date().toISOString()
    }

    if (action === 'thumbs_up') {
      console.log("👍 Processing thumbs up feedback")
      updateData.user_feedback = 'thumbs_up'
      updateData.is_manually_selected = false
      updateData.selected_from_top3_index = null
    } else if (action === 'thumbs_down') {
      console.log("👎 Processing thumbs down feedback")
      updateData.user_feedback = 'thumbs_down'
      // Don't change value, just mark for user to select from alternatives
    } else if (action === 'select_from_top3') {
      console.log(`✅ Processing value selection from top 3 (index: ${selectedIndex})`)
      
      // Validate that we have top3 data
      if (!currentData.top3_values || currentData.top3_values.length === 0) {
        console.error("❌ No top 3 alternatives available")
        return new Response(
          JSON.stringify({ error: "No alternative values available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      if (selectedIndex! >= currentData.top3_values.length) {
        console.error("❌ Selected index out of range")
        return new Response(
          JSON.stringify({ error: `Selected index ${selectedIndex} is out of range. Only ${currentData.top3_values.length} alternatives available.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      // Get the selected value and its metadata
      const selectedValue = currentData.top3_values[selectedIndex!]
      const selectedConfidence = currentData.top3_confidences?.[selectedIndex!] || null
      const selectedPageNumber = currentData.top3_page_numbers?.[selectedIndex!] || null
      const selectedBoundingBox = currentData.top3_bounding_boxes?.[selectedIndex!] || null
      const selectedLabelPageNumber = currentData.top3_label_page_numbers?.[selectedIndex!] || null
      const selectedLabelBoundingBox = currentData.top3_label_bounding_boxes?.[selectedIndex!] || null
      
      console.log(`  - Selected value: "${selectedValue}"`)
      console.log(`  - Selected confidence: ${selectedConfidence}`)
      console.log(`  - Selected page: ${selectedPageNumber}`)
      console.log(`  - Has bounding box: ${selectedBoundingBox ? '✅' : '❌'}`)
      console.log(`  - Has label bounding box: ${selectedLabelBoundingBox ? '✅' : '❌'}`)

      updateData.value = selectedValue
      updateData.confidence = selectedConfidence
      updateData.user_feedback = 'thumbs_down'  // Mark as thumbs_down since user rejected original
      updateData.is_manually_selected = true
      updateData.selected_from_top3_index = selectedIndex
    }

    console.log("💾 Updating extracted_data record...")
    const { data: updatedData, error: updateError } = await supabaseClient
      .from("extracted_data")
      .update(updateData)
      .eq("id", extractedDataId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error updating extracted data:", updateError)
      return new Response(
        JSON.stringify({ error: "Failed to update feedback", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // If user selected from top 3, also update document_fields with new bounding box data
    if (action === 'select_from_top3' && currentData.field_id) {
      console.log("📝 Updating document_fields with new bounding box data...")
      
      const selectedPageNumber = currentData.top3_page_numbers?.[selectedIndex!] || null
      const selectedBoundingBox = currentData.top3_bounding_boxes?.[selectedIndex!] || null
      const selectedLabelPageNumber = currentData.top3_label_page_numbers?.[selectedIndex!] || null
      const selectedLabelBoundingBox = currentData.top3_label_bounding_boxes?.[selectedIndex!] || null
      
      const fieldUpdateData: any = {}
      if (selectedPageNumber) fieldUpdateData.page_number = selectedPageNumber
      if (selectedBoundingBox) fieldUpdateData.bounding_box = selectedBoundingBox
      if (selectedLabelPageNumber) fieldUpdateData.label_page_number = selectedLabelPageNumber
      if (selectedLabelBoundingBox) fieldUpdateData.label_bounding_box = selectedLabelBoundingBox
      
      if (Object.keys(fieldUpdateData).length > 0) {
        const { error: fieldUpdateError } = await supabaseClient
          .from("document_fields")
          .update(fieldUpdateData)
          .eq("id", currentData.field_id)
        
        if (fieldUpdateError) {
          console.error("⚠️ Failed to update document_fields:", fieldUpdateError)
          // Don't fail the whole request, just log the error
        } else {
          console.log("✅ Document fields updated with new bounding box data")
        }
      }
    }

    console.log("✅ Feedback updated successfully!")
    console.log("========================================")

    return new Response(
      JSON.stringify({
        success: true,
        message: `Feedback ${action} recorded successfully`,
        updatedData: {
          id: updatedData.id,
          value: updatedData.value,
          confidence: updatedData.confidence,
          userFeedback: updatedData.user_feedback,
          isManuallySelected: updatedData.is_manually_selected,
          selectedFromTop3Index: updatedData.selected_from_top3_index,
          feedbackTimestamp: updatedData.feedback_timestamp
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("========================================")
    console.error("❌ FEEDBACK UPDATE ERROR:")
    console.error(error)
    console.error("========================================")
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Feedback update failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
