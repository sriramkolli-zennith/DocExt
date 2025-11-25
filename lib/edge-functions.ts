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
): Promise<{ data?: T; error?: string; status?: number }> {
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
      return {
        error: result.error || "Function call failed",
        data: result,
        status: response.status,
      }
    }

    return { data: result, status: response.status }
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
      originalFileName: uploadData.originalFileName,
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
  originalFileName?: string
  fileHash?: string
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

/**
 * Check if a document with the same contents already exists
 */
export async function checkDuplicateDocument(params: {
  fileHash: string
  fileName?: string
}): Promise<{
  exists: boolean
  document?: { id: string; name: string; storage_path: string }
}> {
  try {
    const { fileHash, fileName } = params
    console.log('checkDuplicateDocument called with hash:', fileHash)
    const supabase = createClient()
    
    const normalizedHash = fileHash.trim().toLowerCase()

    // Query documents with matching file hash first
    const { data: hashMatches, error } = await supabase
      .from("documents")
      .select("id, name, storage_path")
      .eq("file_hash", normalizedHash)
      .order("created_at", { ascending: false })
      .limit(1)
    
    if (error) {
      console.error("Error checking duplicates:", error)
      return { exists: false }
    }

    if (hashMatches && hashMatches.length > 0) {
      const duplicate = hashMatches[0]
      console.log('Duplicate found by file hash:', duplicate)
      return {
        exists: true,
        document: duplicate,
      }
    }

    if (!fileName) {
      console.log('No duplicate found by hash and no filename fallback provided')
      return { exists: false }
    }

    const normalizedFileName = fileName.trim()

    console.log('No duplicate found by original filename, checking legacy records...')

    const { data: legacyDocuments, error: legacyError } = await supabase
      .from("documents")
      .select("id, name, storage_path, original_filename")
      .or('original_filename.is.null,file_hash.is.null')
      .order("created_at", { ascending: false })
      .limit(50)

    if (legacyError) {
      console.error("Error checking legacy duplicates:", legacyError)
      return { exists: false }
    }

    const legacyDuplicate = legacyDocuments?.find(doc => {
      const storagePath = doc.storage_path || ""
      const existingFileName = storagePath.split("/").pop() || ""
      const filenameMatch = doc.original_filename?.trim() === normalizedFileName
      const storageMatch = existingFileName === normalizedFileName
      console.log(`Comparing legacy path "${existingFileName}" or original filename "${doc.original_filename}" with "${normalizedFileName}"`)
      return filenameMatch || storageMatch
    })

    if (legacyDuplicate) {
      console.log('Duplicate found via legacy storage path:', legacyDuplicate)
      return {
        exists: true,
        document: legacyDuplicate
      }
    }

    console.log('No duplicate found in any source')
    return { exists: false }
  } catch (error) {
    console.error("Error in checkDuplicateDocument:", error)
    return { exists: false }
  }
}

