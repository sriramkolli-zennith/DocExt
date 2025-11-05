"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
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

interface ExtractedField {
  id: string
  fieldId: string
  fieldName: string
  fieldType: string
  fieldDescription: string
  value: string
  confidence: number | null
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
  const router = useRouter()
  const supabase = createClient()

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
      await supabase.from("extracted_data").delete().eq("field_id", fieldId)
      const { error } = await supabase.from("document_fields").delete().eq("id", fieldId)

      if (error) throw error
      setFields(fields.filter((f) => f.fieldId !== fieldId))
    } catch (error) {
      console.error("Failed to delete field:", error)
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Document not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <Link href="/documents" className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{document.name}</h1>
            <p className="text-muted-foreground">
              Status: <span className={`capitalize font-medium ${isProcessing || document.status === 'processing' ? 'text-yellow-600' : ''}`}>
                {isProcessing ? 'processing' : document.status}
              </span> • {fields.length} field{fields.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportData} 
              disabled={fields.length === 0 || isProcessing} 
              className="gap-2 bg-transparent"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRerun} 
              disabled={fields.length === 0 || isProcessing} 
              className="gap-2 bg-transparent"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Field</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddField} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Field name"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                  <Button type="submit" className="gap-2 w-full" disabled={isProcessing}>
                    <Plus className="h-4 w-4" />
                    {isProcessing ? 'Adding & Extracting...' : 'Add Field'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Extracted Fields */}
            <div className="space-y-3">
              {fields.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No fields extracted yet.
                  </CardContent>
                </Card>
              ) : (
                fields.map((field) => (
                  <Card key={field.id} className="hover:shadow-md transition">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-muted-foreground">{field.fieldName}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {field.fieldType}
                            </span>
                          </div>
                          <p className="text-base font-medium">{field.value || "Not extracted"}</p>
                          {field.confidence && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Confidence: {(field.confidence * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedField(field)
                              setIsModalOpen(true)
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(field.id)}
                            className="text-destructive hover:bg-destructive/10"
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
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{document.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(document.createdAt).toLocaleDateString()}</p>
                </div>
                {document.processedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Processed</p>
                    <p className="font-medium">{new Date(document.processedAt).toLocaleDateString()}</p>
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
  )
}
