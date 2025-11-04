"use client"

import type React from "react"

import { useState, useRef } from "react"
import { uploadDocument, processDocument } from "@/lib/edge-functions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Plus, X, Loader2, FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

interface FieldToExtract {
  id: string
  name: string
  type: string
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
  const [files, setFiles] = useState<File[]>([])
  const [fields, setFields] = useState<FieldToExtract[]>([])
  const [newField, setNewField] = useState("")
  const [newFieldType, setNewFieldType] = useState("text")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"name" | "upload" | "fields">("name")
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentName.trim()) {
      setError("Please enter a document name")
      return
    }
    setError(null)
    setStep("upload")
  }

  const handleFileSelect = (newFiles: FileList | null) => {
    if (!newFiles) return
    
    const maxSize = 50 * 1024 * 1024 // 50MB
    const validFiles = Array.from(newFiles).filter((file) => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large (max 50MB)`)
        return false
      }
      return true
    })
    setFiles([...files, ...validFiles])
    setError(null)
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
    handleFileSelect(e.dataTransfer.files)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      setError("Please upload at least one document")
      return
    }
    setError(null)
    setStep("fields")
  }

  const addField = (fieldName?: string, fieldType?: string) => {
    const name = fieldName || newField
    const type = fieldType || newFieldType
    
    if (!name.trim()) {
      setError("Please enter a field name")
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
      // Process each file
      for (const file of files) {
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
          fieldsToExtract: fields.map((f) => ({ name: f.name, type: f.type })),
        })

        if (processError) {
          throw new Error(processError)
        }
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract documents")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        {step === "name" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">New Extraction</CardTitle>
              <CardDescription>Step 1: Give your extraction a name</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="documentName">Extraction Name</Label>
                  <Input
                    id="documentName"
                    type="text"
                    placeholder="e.g., Invoice Batch #1"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">Give this extraction a descriptive name</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" size="lg" className="w-full">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Upload Documents</CardTitle>
              <CardDescription>Step 2: Upload the documents you want to extract data from</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                    isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold mb-1">Drag files here or click to select</p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, PNG, JPG, TIFF (Max 50MB each)
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold text-sm">Uploaded Files ({files.length}):</p>
                    <div className="grid gap-3">
                      {files.map((file, idx) => (
                        <Card key={idx} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0">
                                <FileText className="h-8 w-8 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
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
                                className="shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep("name")} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" size="lg" className="flex-1">
                    Continue
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "fields" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Extract Fields</CardTitle>
              <CardDescription>Step 3: Specify which fields you want to extract from the documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Common Field Suggestions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Common Invoice Fields</span>
                    {showSuggestions ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>
                  
                  {showSuggestions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {COMMON_INVOICE_FIELDS.map((suggestion) => {
                        const isAdded = fields.some(f => f.name === suggestion.name)
                        return (
                          <button
                            key={suggestion.name}
                            type="button"
                            onClick={() => !isAdded && addSuggestedField(suggestion)}
                            disabled={isAdded}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              isAdded 
                                ? 'bg-muted/50 border-muted cursor-not-allowed opacity-60' 
                                : 'bg-background hover:bg-muted/50 hover:border-primary cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{suggestion.name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    suggestion.type === 'currency' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    suggestion.type === 'date' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                    suggestion.type === 'number' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                  }`}>
                                    {suggestion.type}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                              </div>
                              {isAdded && <Plus className="h-4 w-4 text-muted-foreground rotate-45" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Add Custom Field */}
                <div className="space-y-3">
                  <p className="font-semibold">Add Custom Field:</p>
                  <div className="flex gap-2">
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
                      className="flex-1"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {FIELD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" onClick={() => addField()} className="gap-2 bg-transparent">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Fields to Extract ({fields.length}):</p>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{field.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              field.type === 'currency' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              field.type === 'date' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              field.type === 'number' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              field.type === 'email' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              field.type === 'phone' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                              field.type === 'boolean' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {field.type}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeField(field.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep("upload")} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExtraction}
                    disabled={isLoading}
                    size="lg"
                    className="flex-1 gap-2"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? "Extracting..." : "Start Extraction"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
