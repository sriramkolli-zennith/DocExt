import { createClient } from "@/lib/client"

/**
 * Helper function to call Supabase Edge Functions
 * @param functionName - The name of the edge function to call
 * @param payload - The data to send to the function
 * @returns The response from the edge function
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  payload: any
): Promise<{ data?: T; error?: string }> {
  try {
    const supabase = createClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured")
    }

    // Get auth session for authorization header
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { error: "No active session" }
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || "Function call failed" }
    }

    return { data: result }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Upload a file to Supabase Storage via edge function
 */
export async function uploadDocument(file: File, documentName: string) {
  // First, get signed upload URL
  const { data: uploadData, error: uploadError } = await callEdgeFunction("upload-document-backend", {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  })

  if (uploadError || !uploadData) {
    return { error: uploadError || "Failed to prepare upload" }
  }

  // Upload file to signed URL
  const uploadResponse = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
  })

  if (!uploadResponse.ok) {
    return { error: "Failed to upload file" }
  }

  return {
    data: {
      filePath: uploadData.filePath,
      publicUrl: uploadData.publicUrl,
    },
  }
}

/**
 * Process a document and extract fields
 */
export async function processDocument(params: {
  documentId?: string
  documentName: string
  filePath: string
  publicUrl: string
  fieldsToExtract: string[] | Array<{ name: string; type?: string; description?: string }>
}) {
  return callEdgeFunction("process-document-backend", params)
}

/**
 * Get extracted data for a document
 */
export async function getExtractedData(documentId: string) {
  return callEdgeFunction("get-extracted-data-backend", { documentId })
}

