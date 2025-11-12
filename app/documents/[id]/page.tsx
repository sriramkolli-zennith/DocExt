"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useSessionManager } from "@/lib/useSessionManager"
import { SessionWarningModal } from "@/components/session-warning-modal"
import { PDFViewerSidebar } from "@/components/pdf-viewer-sidebar"
import { getExtractedData, processDocument } from "@/lib/edge-functions"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Eye, Trash2, Download, RotateCcw } from "lucide-react"
import Navbar from "@/components/navbar"
import FieldValidationModal from "@/components/field-validation-modal"

interface BoundingRegion {
  pageNumber: number
  polygon: number[]
}

interface ExtractedField {
  id: string
  fieldId: string
  fieldName: string
  fieldType: string
  fieldDescription: string
  value: string
  confidence: number | null
  boundingRegions?: BoundingRegion[]
  pageNumber?: number
  boundingBox?: number[]
}

interface Document {
  id: string
  name: string
  storagePath: string
  status: string
  createdAt: string
  processedAt: string | null
}

export default function DocumentDetailPage() {
  const params = useParams()
  const documentId = params.id as string
  const [document, setDocument] = useState<Document | null>(null)
  const [fields, setFields] = useState<ExtractedField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState("text")
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pdfSidebarOpen, setPdfSidebarOpen] = useState(false)
  const [selectedFieldForPDF, setSelectedFieldForPDF] = useState<ExtractedField | null>(null)
  const router = useRouter()
  const supabase = createClient()
  
  // Initialize session manager for activity tracking and timeout
  const { showWarning, extendSession } = useSessionManager()

  useEffect(() => {
    fetchData()
  }, [documentId])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: extractedData, error } = await getExtractedData(documentId)

      if (error) {
        console.error("Failed to fetch data:", error)
        return
      }

      if (extractedData) {
        setDocument(extractedData.document)
        setFields(extractedData.extractedFields || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldName.trim() || !document) return

    setIsProcessing(true)

    try {
      // First, create the field in the database
      const { data: fieldData, error: fieldError } = await supabase
        .from("document_fields")
        .insert({
          document_id: documentId,
          name: newFieldName,
          type: newFieldType,
          description: `User-added field: ${newFieldName}`,
        })
        .select()
        .single()

      if (fieldError) throw fieldError

      // Add field to UI with empty value and processing status
      const newField: ExtractedField = {
        id: fieldData.id,
        fieldId: fieldData.id,
        fieldName: fieldData.name,
        fieldType: fieldData.type,
        fieldDescription: fieldData.description,
        value: "Processing...",
        confidence: null,
      }

      setFields([...fields, newField])
      setNewFieldName("")
      setNewFieldType("text")

      // Update document status to processing
      await supabase
        .from("documents")
        .update({ status: "processing" })
        .eq("id", documentId)

      // Get the public URL for the document
      const { data: publicUrlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(document.storagePath)

      const publicUrl = publicUrlData.publicUrl

      // Trigger Azure extraction for the new field
      console.log("Triggering extraction for new field:", newFieldName)
      console.log("Document path:", document.storagePath)
      console.log("Public URL:", publicUrl)

      const { data: processData, error: processError } = await processDocument({
        documentId: documentId,
        documentName: document.name,
        filePath: document.storagePath,
        publicUrl: publicUrl,
        fieldsToExtract: [{ 
          name: newFieldName, 
          type: newFieldType, 
          description: `User-added field: ${newFieldName}` 
        }],
      })

      if (processError) {
        console.error("Extraction error:", processError)
        // Update the field to show extraction failed
        setFields(prevFields => 
          prevFields.map(f => 
            f.fieldId === fieldData.id 
              ? { ...f, value: "Extraction failed" }
              : f
          )
        )
      } else {
        console.log("Extraction successful:", processData)
      }

      // Refresh data after a delay to get the extracted value
      setTimeout(() => {
        fetchData()
        setIsProcessing(false)
      }, 3000)
    } catch (error) {
      console.error("Failed to add field:", error)
      setIsProcessing(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!window.confirm("Delete this field?")) return

    try {
      // Delete extracted data first
      const { error: dataError } = await supabase
        .from("extracted_data")
        .delete()
        .eq("field_id", fieldId)

      if (dataError) throw dataError

      // Then delete the field
      const { error: fieldError } = await supabase
        .from("document_fields")
        .delete()
        .eq("id", fieldId)

      if (fieldError) throw fieldError

      // Update UI - filter by id or fieldId
      setFields(fields.filter((f) => f.id !== fieldId && f.fieldId !== fieldId))
    } catch (error) {
      console.error("Failed to delete field:", error)
      alert("Failed to delete field. Please try again.")
    }
  }

  const handleRerun = async () => {
    if (!document || fields.length === 0) return

    setIsProcessing(true)

    try {
      // Update document status to processing
      await supabase
        .from("documents")
        .update({ status: "processing" })
        .eq("id", documentId)

      // Update all fields to show processing
      setFields(prevFields => 
        prevFields.map(f => ({ ...f, value: "Processing..." }))
      )

      // Prepare all fields for extraction
      const fieldsToExtract = fields.map(field => ({
        name: field.fieldName,
        type: field.fieldType,
        description: field.fieldDescription,
      }))

      // Get the public URL for the document
      const { data: publicUrlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(document.storagePath)

      const publicUrl = publicUrlData.publicUrl

      console.log("Rerunning extraction for all fields:", fieldsToExtract)
      console.log("Document path:", document.storagePath)
      console.log("Public URL:", publicUrl)

      // Trigger Azure extraction for all fields
      const { data: processData, error: processError } = await processDocument({
        documentId: documentId,
        documentName: document.name,
        filePath: document.storagePath,
        publicUrl: publicUrl,
        fieldsToExtract: fieldsToExtract,
      })

      if (processError) {
        console.error("Rerun extraction error:", processError)
        alert("Failed to rerun extraction. Please try again.")
      } else {
        console.log("Rerun extraction successful:", processData)
      }

      // Refresh data after a delay to get the extracted values
      setTimeout(() => {
        fetchData()
        setIsProcessing(false)
      }, 5000)
    } catch (error) {
      console.error("Failed to rerun extraction:", error)
      setIsProcessing(false)
      alert("Failed to rerun extraction. Please try again.")
    }
  }

  const handleFieldValueChange = async (fieldId: string, newValue: string) => {
    try {
      const { data: existingData } = await supabase
        .from("extracted_data")
        .select("id")
        .eq("document_id", documentId)
        .eq("field_id", fieldId)
        .single()

      if (existingData) {
        const { error } = await supabase
          .from("extracted_data")
          .update({ value: newValue })
          .eq("document_id", documentId)
          .eq("field_id", fieldId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("extracted_data")
          .insert({
            document_id: documentId,
            field_id: fieldId,
            value: newValue,
            confidence: null,
          })

        if (error) throw error
      }

      setFields(fields.map((f) => (f.fieldId === fieldId ? { ...f, value: newValue } : f)))
    } catch (error) {
      console.error("Failed to update field:", error)
    }
  }

  const handleExportData = () => {
    const csvContent = [
      ["Field Name", "Type", "Value", "Confidence"],
      ...fields.map((f) => [
        f.fieldName,
        f.fieldType,
        f.value,
        f.confidence ? (f.confidence * 100).toFixed(0) + "%" : "N/A",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = globalThis.document?.createElement("a")
    if (link) {
      link.href = url
      link.download = `${document?.name}-extracted.csv`
      link.click()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">Document not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <Navbar />
      <SessionWarningModal open={showWarning} onExtend={extendSession} />

      <div className={`transition-all duration-300 ease-out ${pdfSidebarOpen ? "lg:pr-[50%]" : "pr-0"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <Link href="/documents" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{document.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Status: <span className={`capitalize font-medium ${isProcessing || document.status === 'processing' ? 'text-yellow-500 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {isProcessing ? 'processing' : document.status}
              </span> • {fields.length} field{fields.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportData} 
              disabled={fields.length === 0 || isProcessing} 
              className="gap-2 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRerun} 
              disabled={fields.length === 0 || isProcessing} 
              className="gap-2 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <RotateCcw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Processing...' : 'Re-run'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fields Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add New Field */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <CardTitle className="text-lg text-gray-900 dark:text-white">Add Field</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddField} className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Input
                      placeholder="Field name"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="h-9 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-600"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="currency">Currency</option>
                      <option value="address">Address</option>
                      <option value="url">URL</option>
                    </select>
                  </div>
                  <Button type="submit" className="gap-2 w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-60" disabled={isProcessing}>
                    <Plus className="h-4 w-4" />
                    {isProcessing ? 'Adding & Extracting...' : 'Add Field'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Extracted Fields */}
            <div className="space-y-3 sm:space-y-4">
              {fields.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                  <CardContent className="py-8 text-center text-gray-600 dark:text-gray-400">
                    No fields extracted yet.
                  </CardContent>
                </Card>
              ) : (
                fields.map((field) => (
                  <Card 
                    key={field.id} 
                    className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-md dark:hover:shadow-lg transition cursor-pointer" 
                    onMouseEnter={() => {
                      // Only show sidebar on desktop (lg and up)
                      if (window.innerWidth >= 1024) {
                        setSelectedFieldForPDF(field)
                        setPdfSidebarOpen(true)
                      }
                    }}
                    onMouseLeave={() => {
                      // Close sidebar when mouse leaves the card
                      setPdfSidebarOpen(false)
                    }}
                    onClick={() => {
                      setSelectedFieldForPDF(field)
                      setPdfSidebarOpen(true)
                    }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{field.fieldName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              field.fieldType === 'currency' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                              field.fieldType === 'date' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                              field.fieldType === 'number' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                              field.fieldType === 'email' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                              field.fieldType === 'phone' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' :
                              field.fieldType === 'address' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                              field.fieldType === 'url' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300'
                            }`}>
                              {field.fieldType}
                            </span>
                          </div>
                          <p className="text-base font-medium break-words text-gray-900 dark:text-white">{field.value || "Not extracted"}</p>
                          {field.confidence && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              Confidence: {(field.confidence * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFieldForPDF(field)
                              setPdfSidebarOpen(true)
                            }}
                            className="gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                            title="View in PDF"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View PDF</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedField(field)
                              setIsModalOpen(true)
                            }}
                            className="hidden sm:flex gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
                            title="Edit value"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteField(field.fieldId)
                            }}
                            className="hidden sm:flex text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Delete field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Document Info Sidebar */}
          <div>
            <Card className="sticky top-20 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <CardTitle className="text-lg text-gray-900 dark:text-white">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-medium capitalize text-gray-900 dark:text-white">{document.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(document.createdAt).toLocaleDateString()}</p>
                </div>
                {document.processedAt && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processed</p>
                    <p className="font-medium text-gray-900 dark:text-white">{new Date(document.processedAt).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Total Fields</p>
                  <p className="font-medium">{fields.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Validation Modal */}
        {selectedField && (
          <FieldValidationModal
            isOpen={isModalOpen}
            field={selectedField}
            documentUrl={document.storagePath}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedField(null)
            }}
            onFieldValueChange={handleFieldValueChange}
          />
        )}
        </div>
      </div>

      {/* PDF Viewer Sidebar */}
      {selectedFieldForPDF && document && (
        <PDFViewerSidebar
          isOpen={pdfSidebarOpen}
          onClose={() => {
            setPdfSidebarOpen(false)
            setTimeout(() => setSelectedFieldForPDF(null), 300)
          }}
          pdfUrl={supabase.storage.from('documents').getPublicUrl(document.storagePath).data.publicUrl}
          fieldName={selectedFieldForPDF.fieldName}
          fieldValue={selectedFieldForPDF.value}
          confidence={selectedFieldForPDF.confidence || undefined}
          pageNumber={selectedFieldForPDF.pageNumber}
          boundingBox={selectedFieldForPDF.boundingBox}
        />
      )}
    </div>
  )
}
