import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface UploadRequest {
  fileName: string
  fileType: string
  fileSize: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const { fileName, fileType, fileSize }: UploadRequest = await req.json()

    // Validate input
    if (!fileName || !fileType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 50MB limit" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Generate unique file path
    const fileExt = fileName.split(".").pop()
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${uniqueFileName}`

    // Generate signed upload URL (valid for 5 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from("documents")
      .createSignedUploadUrl(filePath)

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError)
      return new Response(
        JSON.stringify({ error: "Failed to generate upload URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Get public URL for the file
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from("documents")
      .getPublicUrl(filePath)

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: signedUrlData.signedUrl,
        filePath,
        publicUrl,
        token: signedUrlData.token,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Upload preparation error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload preparation failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
