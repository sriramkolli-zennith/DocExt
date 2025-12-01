"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useSessionManager } from "@/lib/useSessionManager"
import { SessionWarningModal } from "@/components/session-warning-modal"
import dynamic from "next/dynamic"
import { getExtractedData, processDocument, reExtractSingleField } from "@/lib/edge-functions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Eye, Trash2, Download, RotateCcw, ThumbsUp, ThumbsDown, Edit, X } from "lucide-react"
import Navbar from "@/components/navbar"
import FieldValidationModal from "@/components/field-validation-modal"
import FieldEditModal from "@/components/field-edit-modal"
import { updateFieldFeedback } from "@/lib/edge-functions"
import { CustomAlert } from "@/components/custom-alert"

// Force dynamic rendering
export const dynamicParams = true

// Dynamically import PDFViewerSidebar with no SSR
const PDFViewerSidebar = dynamic(
  () => import("@/components/pdf-viewer-sidebar").then((mod) => ({ default: mod.PDFViewerSidebar })),
  { ssr: false }
)

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
  labelPageNumber?: number
  labelBoundingBox?: number[]
  top3Values?: string[]
  top3Confidences?: number[]
  top3PageNumbers?: number[]
  top3BoundingBoxes?: number[][]
  top3LabelPageNumbers?: number[]
  top3LabelBoundingBoxes?: number[][]
  userFeedback?: string | null
  isManuallySelected?: boolean
  selectedFromTop3Index?: number | null
  feedbackAttemptCount?: number
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
  const [pdfAutoCloseEnabled, setPdfAutoCloseEnabled] = useState(false)
  const [pdfAutoCloseToken, setPdfAutoCloseToken] = useState(0)
  const [selectedFieldForPDF, setSelectedFieldForPDF] = useState<ExtractedField | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<ExtractedField | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFieldType, setEditFieldType] = useState('')
  const [inlineFeedback, setInlineFeedback] = useState<{ type: "success" | "info" | "warning"; message: string } | null>(null)
  
  // Custom alert states
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string
    description?: string
    type: "success" | "error" | "warning" | "info"
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
  }>({
    title: "",
    type: "info",
  })
  
  const router = useRouter()
  const supabase = createClient()
  
  // Initialize session manager for activity tracking and timeout
  const { showWarning, extendSession } = useSessionManager()

  useEffect(() => {
    if (!inlineFeedback) return
    const timer = setTimeout(() => setInlineFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [inlineFeedback])

  // Helper functions for custom alerts
  const showAlert = (
    title: string,
    description?: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlertConfig({ title, description, type })
    setAlertOpen(true)
  }

  const showConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    type: "warning" | "error" = "warning",
    confirmText: string = "Confirm",
    cancelText: string = "Cancel"
  ) => {
    setAlertConfig({ title, description, type, onConfirm, confirmText, cancelText })
    setAlertOpen(true)
  }

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
              ? { ...f, value: "Failed to Extract" }
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
    const field = fields.find(f => f.fieldId === fieldId || f.id === fieldId)
    showConfirm(
      "Delete Field",
      `Are you sure you want to delete the field "${field?.fieldName}"? This action cannot be undone.`,
      async () => {
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
          showAlert("Field Deleted", "The field has been successfully deleted.", "success")
        } catch (error) {
          console.error("Failed to delete field:", error)
          showAlert("Delete Failed", "Failed to delete field. Please try again.", "error")
        }
      },
      "error",
      "Delete",
      "Cancel"
    )
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
        showAlert("Extraction Failed", "Failed to rerun extraction. Please try again.", "error")
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
      showAlert("Extraction Failed", "Failed to rerun extraction. Please try again.", "error")
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

  const handleFieldUpdate = async (fieldId: string, newFieldName: string, newFieldType: string) => {
    try {
      setFeedbackLoading(fieldId)
      
      // Call re-extract edge function
      const { data, error } = await reExtractSingleField(
        documentId,
        fieldId,
        newFieldName,
        newFieldType
      )
      
      if (error) {
        // Show user-friendly error messages
        if (error.includes('Azure credentials')) {
          showAlert(
            "Configuration Error",
            "Azure Document Intelligence is not configured. Please contact your administrator to set up Azure credentials in Supabase.",
            "error"
          )
        } else if (error.includes('not found')) {
          showAlert(
            "Not Found",
            "Document or field not found. Please refresh the page and try again.",
            "error"
          )
        } else {
          showAlert(
            "Re-extraction Failed",
            `Failed to re-extract field: ${error}`,
            "error"
          )
        }
        throw new Error(error)
      }
      
      // Refresh data to get updated extraction
      await fetchData()
      
      setIsEditModalOpen(false)
      setEditingField(null)
    } catch (error) {
      console.error('Failed to update and re-extract field:', error)
      // Error already shown to user via alert above
    } finally {
      setFeedbackLoading(null)
    }
  }

  const handleThumbsUp = async (field: ExtractedField) => {
    // Check if user has reached the 2-attempt limit
    const currentAttempts = field.feedbackAttemptCount || 0
    if (currentAttempts >= 2) {
      showAlert(
        "Feedback Limit Reached",
        "You have already used your 2 feedback attempts for this field.",
        "warning"
      )
      return
    }

    setFeedbackLoading(field.id)
    try {
      const { data, error } = await updateFieldFeedback({
        extractedDataId: field.id,
        action: 'thumbs_up'
      })
      
      if (error) throw new Error(error)
      
      // Update local state - increment attempt count
      setFields(fields.map(f => 
        f.id === field.id 
          ? { 
              ...f, 
              userFeedback: 'thumbs_up',
              feedbackAttemptCount: currentAttempts + 1
            }
          : f
      ))

      setInlineFeedback({
        type: 'success',
        message: 'Thanks for your feedback! We noted the approval.',
      })
    } catch (error) {
      console.error('Failed to update feedback:', error)
      showAlert("Update Failed", "Failed to update feedback. Please try again.", "error")
    } finally {
      setFeedbackLoading(null)
    }
  }

  const handleThumbsDown = async (field: ExtractedField) => {
    // Build alternatives array: supply up to three values at first, all afterwards
    let alternatives: Array<{ value: string; confidence: number; pageNumber: number; index: number }> = []
    const allAlternatives = (field.top3Values || []).map((val, idx) => ({
      value: val,
      confidence: field.top3Confidences?.[idx] || 0,
      pageNumber: field.top3PageNumbers?.[idx] || 1,
      index: idx
    }))

    if (field.isManuallySelected && field.selectedFromTop3Index !== null) {
      alternatives = allAlternatives
    } else {
      alternatives = allAlternatives.slice(0, 3)
    }

    if (alternatives.length === 0) {
      showAlert('No Alternatives', 'No alternative values available for this field', 'info')
      return
    }
    
    // Show modal with alternatives
    setSelectedField(field)
    setIsModalOpen(true)
  }

  const handleSelectAlternative = async (index: number) => {
    if (!selectedField) return
    
    // Check if user has reached the 2-attempt limit
    const currentAttempts = selectedField.feedbackAttemptCount || 0
    if (currentAttempts >= 2) {
      showAlert(
        'Feedback Limit Reached',
        'You have already used your 2 feedback attempts for this field.',
        'warning'
      )
      setIsModalOpen(false)
      setSelectedField(null)
      return
    }
    
    // Get the new value and metadata from selected alternative
    const newValue = selectedField.top3Values?.[index]
    const newConfidence = selectedField.top3Confidences?.[index]
    const newPageNumber = selectedField.top3PageNumbers?.[index]
    const newBoundingBox = selectedField.top3BoundingBoxes?.[index]
    const newLabelPageNumber = selectedField.top3LabelPageNumbers?.[index]
    const newLabelBoundingBox = selectedField.top3LabelBoundingBoxes?.[index]
    
    // Store previous state for rollback
    const previousFields = fields
    
    // Optimistic update — close modal and update UI immediately
    setIsModalOpen(false)
    setSelectedField(null)
    setFields(fields.map(f => 
      f.id === selectedField.id 
        ? { 
            ...f, 
            value: newValue || f.value,
            confidence: newConfidence !== undefined ? newConfidence : f.confidence,
            pageNumber: newPageNumber || f.pageNumber,
            boundingBox: newBoundingBox || f.boundingBox,
            labelPageNumber: newLabelPageNumber || f.labelPageNumber,
            labelBoundingBox: newLabelBoundingBox || f.labelBoundingBox,
            userFeedback: 'thumbs_down',
            isManuallySelected: true,
            selectedFromTop3Index: index,
            feedbackAttemptCount: currentAttempts + 1
          }
        : f
    ))
    setInlineFeedback({
      type: 'success',
      message: 'Value updated!',
    })
    
    // Background API call
    try {
      const { data, error } = await updateFieldFeedback({
        extractedDataId: selectedField.id,
        action: 'select_from_top3',
        selectedIndex: index
      })
      
      if (error) throw new Error(error)
      // Success — nothing more to do, UI already updated
    } catch (error) {
      console.error('Failed to select alternative:', error)
      // Rollback optimistic update
      setFields(previousFields)
      showAlert("Selection Failed", "Failed to save your selection. Please try again.", "error")
    } finally {
      setFeedbackLoading(null)
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600 dark:border-slate-600 dark:border-t-indigo-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading document…</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
            <X className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Document not found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The document may have been deleted or you don't have access.</p>
          </div>
          <Link href="/documents" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            ← Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0a0a0f]">
      <Navbar />
      <SessionWarningModal open={showWarning} onExtend={extendSession} />

      <div className={`transition-all duration-300 ease-out ${pdfSidebarOpen ? "lg:pr-[50%]" : "pr-0"}`}>
        {/* Toast-style inline feedback */}
        {inlineFeedback && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium backdrop-blur-sm ${
              inlineFeedback.type === 'success'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25'
                : inlineFeedback.type === 'warning'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-indigo-500/25'
            }`}>
              {inlineFeedback.type === 'success' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </span>
              )}
              {inlineFeedback.message}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Breadcrumb */}
          <nav className="mb-4">
            <ol className="flex items-center gap-1.5 text-sm">
              <li>
                <Link href="/documents" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Documents
                </Link>
              </li>
              <li className="text-slate-300 dark:text-slate-700">/</li>
              <li className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{document.name}</li>
            </ol>
          </nav>

          {/* Header Card */}
          <div className="mb-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/20">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{document.name}</h1>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${
                      isProcessing || document.status === 'processing'
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30'
                        : document.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30'
                        : 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isProcessing || document.status === 'processing' ? 'bg-amber-500 animate-pulse' : document.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      {isProcessing ? 'Processing' : document.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Uploaded {new Date(document.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    disabled={fields.length === 0 || isProcessing}
                    className="h-9 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm hover:shadow transition-all"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRerun}
                    disabled={fields.length === 0 || isProcessing}
                    className="h-9 px-4 text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                  >
                    <RotateCcw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                    {isProcessing ? 'Running…' : 'Re-extract'}
                  </Button>
                </div>
              </div>
            </div>
            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="px-6 py-4 border-r border-b sm:border-b-0 border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fields</p>
                <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">{fields.length}</p>
              </div>
              <div className="px-6 py-4 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Extracted</p>
                <p className="mt-1.5 text-xl font-bold text-emerald-600 dark:text-emerald-400">{fields.filter(f => f.value && f.value !== 'Failed to Extract').length}</p>
              </div>
              <div className="px-6 py-4 border-r border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Confidence</p>
                <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">
                  {fields.length > 0 && fields.some(f => f.confidence != null)
                    ? `${(fields.filter(f => f.confidence != null).reduce((sum, f) => sum + (f.confidence || 0), 0) / fields.filter(f => f.confidence != null).length * 100).toFixed(0)}%`
                    : '—'}
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reviewed</p>
                <p className="mt-1.5 text-xl font-bold text-indigo-600 dark:text-indigo-400">{fields.filter(f => f.userFeedback != null).length}</p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fields Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Add New Field — Compact inline form */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <form onSubmit={handleAddField} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Field name (e.g., Invoice Number)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="flex-1 h-11 bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="h-11 w-full sm:w-[130px] rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white px-3 text-sm font-medium focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
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
                <Button
                  type="submit"
                  disabled={isProcessing || !newFieldName.trim()}
                  className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Extracting…' : 'Add Field'}
                </Button>
              </form>
            </div>

            {/* Extracted Fields */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-900/60">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Extracted Fields</h3>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{fields.length} total</span>
              </div>
              {fields.length === 0 ? (
                <div className="px-5 py-20 text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 mb-4">
                    <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No fields yet</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Add a field above to start extracting data</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="group relative px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedFieldForPDF(field)
                        setPdfSidebarOpen(true)
                        setPdfAutoCloseToken(prev => prev + 1)
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* Field name + type badge */}
                          <div className="flex items-center gap-2.5">
                            <span
                              className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                              onMouseEnter={() => {
                                if (window.innerWidth >= 1024) {
                                  setSelectedFieldForPDF(field)
                                  setPdfSidebarOpen(true)
                                  setPdfAutoCloseToken(prev => prev + 1)
                                }
                              }}
                            >
                              {field.fieldName}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                              field.fieldType === 'currency' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30' :
                              field.fieldType === 'date' ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30' :
                              field.fieldType === 'number' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30' :
                              field.fieldType === 'email' ? 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/30' :
                              field.fieldType === 'phone' ? 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-400 dark:ring-pink-500/30' :
                              field.fieldType === 'address' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/30' :
                              field.fieldType === 'url' ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/30' :
                              'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30'
                            }`}>
                              {field.fieldType}
                            </span>
                          </div>
                          {/* Value */}
                          <p className="text-[15px] font-medium text-slate-700 dark:text-slate-200 break-words leading-relaxed">
                            {field.value || <span className="text-slate-400 dark:text-slate-500 font-normal italic">Not extracted</span>}
                          </p>
                          {/* Confidence bar */}
                          {field.confidence != null && (
                            <div className="flex items-center gap-3 pt-0.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      field.confidence >= 0.9 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : field.confidence >= 0.7 ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-red-400 to-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(field.confidence * 100, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold tabular-nums ${
                                  field.confidence >= 0.9 ? 'text-emerald-600 dark:text-emerald-400' : field.confidence >= 0.7 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                                }`}>
                                  {(field.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              {field.isManuallySelected && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md ring-1 ring-inset ring-indigo-500/20">Manual</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFieldForPDF(field)
                              setPdfSidebarOpen(true)
                              setPdfAutoCloseToken(prev => prev + 1)
                            }}
                            className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                            title="View in PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPdfSidebarOpen(false)
                              setEditingField(field)
                              setIsEditModalOpen(true)
                            }}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
                            title="Edit field"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPdfSidebarOpen(false)
                              handleDeleteField(field.fieldId)
                            }}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            title="Delete field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {field.value && field.value !== 'Failed to Extract' && field.value !== 'Processing...' && (
                            <div className="flex items-center gap-0.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPdfSidebarOpen(false)
                                  handleThumbsUp(field)
                                }}
                                disabled={feedbackLoading === field.id || (field.feedbackAttemptCount || 0) >= 2}
                                className={`p-2.5 rounded-xl transition-all ${
                                  field.userFeedback === 'thumbs_up'
                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                                    : (field.feedbackAttemptCount || 0) >= 2
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10'
                                }`}
                                title={field.userFeedback === 'thumbs_up' ? 'Approved' : 'Approve'}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPdfSidebarOpen(false)
                                  handleThumbsDown(field)
                                }}
                                disabled={feedbackLoading === field.id || (field.feedbackAttemptCount || 0) >= 2}
                                className={`p-2.5 rounded-xl transition-all ${
                                  field.userFeedback === 'thumbs_down'
                                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/15 dark:text-rose-400 ring-1 ring-rose-500/30'
                                    : (field.feedbackAttemptCount || 0) >= 2
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10'
                                }`}
                                title={field.userFeedback === 'thumbs_down' ? 'Alternative selected' : 'See alternatives'}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Document Info Sidebar */}
          <div>
            <div className="sticky top-24 space-y-4">
              {/* Quick Info Card */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-900/60">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Document Info</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                      document.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30'
                        : document.status === 'processing'
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30'
                        : 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30'
                    }`}>
                      {document.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Created</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(document.createdAt).toLocaleDateString()}</span>
                  </div>
                  {document.processedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Processed</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(document.processedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Tips card */}
              <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 dark:from-indigo-950/40 dark:to-violet-950/30 p-5">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 dark:bg-indigo-500/20">
                    <svg className="h-3 w-3 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  </span>
                  Pro Tip
                </p>
                <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">Click any field to view it highlighted in the PDF. Use thumbs up/down to improve future extractions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Field Edit Modal - Edit field name and type, triggers re-extraction */}
        {editingField && (
          <FieldEditModal
            isOpen={isEditModalOpen}
            field={{
              fieldId: editingField.fieldId,
              fieldName: editingField.fieldName,
              fieldType: editingField.fieldType,
              value: editingField.value,
              confidence: editingField.confidence
            }}
            onClose={() => {
              setIsEditModalOpen(false)
              setEditingField(null)
            }}
            onFieldUpdate={handleFieldUpdate}
          />
        )}

        {/* Validation Modal - Show Top Alternatives */}
        {selectedField && (
          (() => {
            const rawAlternatives = (selectedField.top3Values?.map((value, idx) => ({
              value,
              confidence: selectedField.top3Confidences?.[idx] || 0,
              pageNumber: selectedField.top3PageNumbers?.[idx] || 1,
              isOriginal: false,
              index: idx
            })) || [])

            const alternatives = (selectedField.isManuallySelected && selectedField.selectedFromTop3Index !== null)
              ? rawAlternatives
              : rawAlternatives.slice(0, 3)

            return (
              <FieldValidationModal
                isOpen={isModalOpen}
                fieldName={selectedField.fieldName}
                currentValue={selectedField.value}
                alternatives={alternatives}
                onClose={() => {
                  setIsModalOpen(false)
                  setSelectedField(null)
                }}
                onSelectAlternative={handleSelectAlternative}
              />
            )
          })()
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
          labelPageNumber={selectedFieldForPDF.labelPageNumber}
          labelBoundingBox={selectedFieldForPDF.labelBoundingBox}
          autoCloseEnabled={pdfAutoCloseEnabled}
          autoCloseToken={pdfAutoCloseToken}
        />
      )}

      {/* Custom Alert Dialog */}
      <CustomAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title={alertConfig.title}
        description={alertConfig.description}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </div>
  )
}
