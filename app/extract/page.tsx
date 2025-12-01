"use client"

import type React from "react"

import { useState, useRef } from "react"
import { uploadDocument, processDocument, checkDuplicateDocument } from "@/lib/edge-functions"
import { useSessionManager } from "@/lib/useSessionManager"
import { SessionWarningModal } from "@/components/session-warning-modal"
import { DuplicateDocumentModal } from "@/components/duplicate-document-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Plus, X, Loader2, FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { extractionNameSchema, fieldExtractionSchema } from "@/lib/validations"
import { computeFileHash } from "@/lib/utils"

import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

interface FieldToExtract {
  id: string
  name: string
  type: string
}

interface PendingUploadFile {
  file: File
  hash: string
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "boolean", label: "Yes/No" },
]

const COMMON_INVOICE_FIELDS = [
  { name: "InvoiceId", type: "text", description: "Invoice number/ID" },
  { name: "InvoiceDate", type: "date", description: "Invoice date" },
  { name: "DueDate", type: "date", description: "Payment due date" },
  { name: "InvoiceTotal", type: "currency", description: "Total amount" },
  { name: "AmountDue", type: "currency", description: "Amount due" },
  { name: "SubTotal", type: "currency", description: "Subtotal before tax" },
  { name: "TotalTax", type: "currency", description: "Tax amount" },
  { name: "VendorName", type: "text", description: "Vendor/supplier name" },
  { name: "VendorAddress", type: "text", description: "Vendor address" },
  { name: "VendorTaxId", type: "text", description: "Vendor tax ID" },
  { name: "CustomerName", type: "text", description: "Customer name" },
  { name: "CustomerAddress", type: "text", description: "Customer address" },
  { name: "CustomerId", type: "text", description: "Customer ID" },
  { name: "CustomerTaxId", type: "text", description: "Customer tax ID" },
  { name: "PurchaseOrder", type: "text", description: "Purchase order number" },
  { name: "BillingAddress", type: "text", description: "Billing address" },
  { name: "ShippingAddress", type: "text", description: "Shipping address" },
]

export default function ExtractPage() {
  const [documentName, setDocumentName] = useState("")
  const [files, setFiles] = useState<PendingUploadFile[]>([])
  const [fields, setFields] = useState<FieldToExtract[]>([])
  const [newField, setNewField] = useState("")
  const [newFieldType, setNewFieldType] = useState("text")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"name" | "upload" | "fields">("name")
  const [isDragActive, setIsDragActive] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{
    file: File
    hash: string
    documentId: string
    documentName: string
  } | null>(null)
  const [duplicateContext, setDuplicateContext] = useState<"upload-continue" | "process" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  // Initialize session manager for activity tracking and timeout
  const { showWarning, extendSession } = useSessionManager()

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate with Zod
    const validation = extractionNameSchema.safeParse({ documentName })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      setError(firstError.message)
      return
    }
    
    setError(null)
    setStep("upload")
  }

  const handleFileSelect = async (newFiles: FileList | null) => {
    if (!newFiles) return
    
    const maxSize = 50 * 1024 * 1024 // 50MB
    const validFiles = Array.from(newFiles).filter((file) => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large (max 50MB)`)
        return false
      }
      return true
    })
    
    await addFilesWithHashes(validFiles)
  }

  const addFilesWithHashes = async (newFiles: File[]) => {
    try {
      const preparedFiles = await Promise.all(
        newFiles.map(async (file) => ({ file, hash: await computeFileHash(file) }))
      )
      setFiles((prev) => [...prev, ...preparedFiles])
      setError(null)
    } catch (err) {
      console.error("Failed to process selected files:", err)
      setError("Failed to process selected files. Please try again.")
    }
  }

  const findDuplicateInQueuedFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      const entry = files[i]
      console.log('Checking for duplicate before continuing:', entry.file.name)
      const duplicateCheck = await checkDuplicateDocument({ fileHash: entry.hash, fileName: entry.file.name })
      console.log('Duplicate check result:', duplicateCheck)

      if (duplicateCheck.exists && duplicateCheck.document) {
        setDuplicateInfo({
          file: entry.file,
          hash: entry.hash,
          documentId: duplicateCheck.document.id,
          documentName: duplicateCheck.document.name,
        })
        setFiles((prev) => prev.filter((_, idx) => idx !== i))
        setDuplicateContext("upload-continue")
        setShowDuplicateModal(true)
        return true
      }
    }
    return false
  }

  const handleDuplicateModalClose = () => {
    setShowDuplicateModal(false)
    setDuplicateInfo(null)
    setDuplicateContext(null)
  }

  const handleDuplicateContinue = () => {
    if (duplicateContext === "upload-continue") {
      setStep("fields")
    }
    setShowDuplicateModal(false)
    setDuplicateInfo(null)
    setDuplicateContext(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    void handleFileSelect(e.dataTransfer.files)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFileSelect(e.target.files)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      setError("Please upload at least one document")
      return
    }
    const hasDuplicate = await findDuplicateInQueuedFiles()
    if (hasDuplicate) {
      return
    }
    setError(null)
    setStep("fields")
  }

  const addField = (fieldName?: string, fieldType?: string) => {
    const name = fieldName || newField
    const type = fieldType || newFieldType
    
    // Validate with Zod
    const validation = fieldExtractionSchema.safeParse({ name, type })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      setError(firstError.message)
      return
    }
    
    // Check if field already exists
    if (fields.some(f => f.name === name)) {
      setError("Field already exists")
      return
    }
    
    const newFieldObj: FieldToExtract = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      type: type,
    }
    setFields([...fields, newFieldObj])
    setNewField("")
    setNewFieldType("text")
    setError(null)
    setShowSuggestions(false)
  }

  const addSuggestedField = (suggestion: typeof COMMON_INVOICE_FIELDS[0]) => {
    addField(suggestion.name, suggestion.type)
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const handleExtraction = async () => {
    if (fields.length === 0) {
      setError("Please add at least one field to extract")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let lastDocumentId: string | null = null

      // Process each file
      for (const { file, hash } of files) {
        // Step 1: Upload document via edge function
        const { data: uploadData, error: uploadError } = await uploadDocument(file, documentName)

        if (uploadError || !uploadData) {
          throw new Error(uploadError || "Failed to upload document")
        }

        // Step 2: Process document and extract fields via edge function
        const { data: processData, error: processError } = await processDocument({
          documentName,
          filePath: uploadData.filePath,
          publicUrl: uploadData.publicUrl,
          originalFileName: uploadData.originalFileName,
          fileHash: hash,
          fieldsToExtract: fields.map((f) => ({ name: f.name, type: f.type })),
        })

        if (processError) {
          if (
            processError === "Document already uploaded" &&
            processData &&
            "documentId" in processData &&
            typeof processData.documentId === "string"
          ) {
            setDuplicateInfo({
              file,
              hash,
              documentId: processData.documentId,
              documentName:
                ("documentName" in processData && typeof processData.documentName === "string"
                  ? processData.documentName
                  : documentName) || "Existing Document",
            })
            setDuplicateContext("process")
            setShowDuplicateModal(true)
            setIsLoading(false)
            return
          }
          throw new Error(processError)
        }

        // Capture the document ID from response
        if (processData && processData.documentId) {
          lastDocumentId = processData.documentId
        }
      }

      // Redirect to the document detail page with the ID
      if (lastDocumentId) {
        router.push(`/documents/${lastDocumentId}`)
      } else {
        router.push("/documents")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract documents")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar />
      <SessionWarningModal open={showWarning} onExtend={extendSession} />
      <DuplicateDocumentModal
        isOpen={showDuplicateModal}
        onClose={handleDuplicateModalClose}
        onContinue={handleDuplicateContinue}
        duplicateDocumentId={duplicateInfo?.documentId || ""}
        duplicateDocumentName={duplicateInfo?.documentName || ""}
        fileName={duplicateInfo?.file.name || ""}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {step === "name" && (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">New Extraction</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Step 1: Give your extraction a name</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="documentName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Extraction Name</Label>
                  <Input
                    id="documentName"
                    type="text"
                    placeholder="e.g., Invoice Batch #1"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    autoFocus
                    className="h-11 bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Give this extraction a descriptive name</p>
                </div>
                {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
                <Button type="submit" size="lg" className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl">
                  Continue
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === "upload" && (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Upload Documents</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Step 2: Upload the documents you want to extract data from</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500/50" 
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.tiff"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 mx-auto mb-4">
                    <Upload className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Drag files here or click to select</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Supported formats: PDF, PNG, JPG, TIFF (Max 50MB each)
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Uploaded Files ({files.length}):</p>
                    <div className="space-y-2">
                      {files.map(({ file }, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 shrink-0">
                            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-slate-800 dark:text-slate-200">{file.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(idx)
                            }}
                            className="h-9 w-9 rounded-xl shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep("name")} className="flex-1 h-11 font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                    Back
                  </Button>
                  <Button type="submit" size="lg" className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl">
                    Continue
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === "fields" && (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50/80 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Extract Fields</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Step 3: Specify which fields you want to extract from the documents</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Common Field Suggestions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Common Invoice Fields</span>
                    {showSuggestions ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>
                  
                  {showSuggestions && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {COMMON_INVOICE_FIELDS.map((suggestion) => {
                        const isAdded = fields.some(f => f.name === suggestion.name)
                        return (
                          <button
                            key={suggestion.name}
                            type="button"
                            onClick={() => !isAdded && addSuggestedField(suggestion)}
                            disabled={isAdded}
                            className={`p-3 rounded-xl border text-left transition-all text-sm ${
                              isAdded 
                                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60' 
                                : 'bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/40 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{suggestion.name}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ring-1 ring-inset ${
                                    suggestion.type === 'currency' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30' :
                                    suggestion.type === 'date' ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30' :
                                    suggestion.type === 'number' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30' :
                                    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-500/30'
                                  }`}>
                                    {suggestion.type}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{suggestion.description}</p>
                              </div>
                              {isAdded && <Plus className="h-4 w-4 text-slate-400 dark:text-slate-500 rotate-45 shrink-0" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Add Custom Field */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Add Custom Field:</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Input
                      placeholder="e.g., InvoiceTotal, CustomerName"
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addField()
                        }
                      }}
                      className="flex-1 h-11 text-sm bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" onClick={() => addField()} className="h-11 gap-2 w-full sm:w-auto font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Fields to Extract ({fields.length}):</p>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{field.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ring-1 ring-inset flex-shrink-0 ${
                              field.type === 'currency' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30' :
                              field.type === 'date' ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30' :
                              field.type === 'number' ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30' :
                              field.type === 'email' ? 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/30' :
                              field.type === 'phone' ? 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-500/10 dark:text-pink-400 dark:ring-pink-500/30' :
                              field.type === 'boolean' ? 'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/30' :
                              'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-500/30'
                            }`}>
                              {field.type}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeField(field.id)} className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex-shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep("upload")} className="flex-1 h-11 font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExtraction}
                    disabled={isLoading}
                    size="lg"
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-60 transition-all rounded-xl"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? "Extracting..." : "Start Extraction"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}