"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, RefreshCw } from "lucide-react"

interface EditableField {
  fieldId: string
  fieldName: string
  fieldType: string
  value: string
  confidence: number | null
}

export interface FieldEditModalProps {
  isOpen: boolean
  field: EditableField | null
  onClose: () => void
  onFieldUpdate: (fieldId: string, newFieldName: string, newFieldType: string) => Promise<void> | void
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "currency", label: "Currency" },
  { value: "boolean", label: "Boolean" },
  { value: "address", label: "Address" },
  { value: "url", label: "URL" },
]

export default function FieldEditModal({
  isOpen,
  field,
  onClose,
  onFieldUpdate,
}: FieldEditModalProps) {
  const [editedFieldName, setEditedFieldName] = useState(field?.fieldName || "")
  const [editedFieldType, setEditedFieldType] = useState(field?.fieldType || "text")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (field) {
      setEditedFieldName(field.fieldName || "")
      setEditedFieldType(field.fieldType || "text")
      setErrorMessage(null)
    }
  }, [field])

  if (!isOpen || !field) {
    return null
  }

  const hasChanges = 
    editedFieldName !== field.fieldName || 
    editedFieldType !== field.fieldType

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editedFieldName.trim()) {
      setErrorMessage("Please enter a field name.")
      return
    }

    if (!hasChanges) {
      setErrorMessage("No changes detected.")
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await onFieldUpdate(field.fieldId, editedFieldName.trim(), editedFieldType)
      onClose()
    } catch (error) {
      console.error("Failed to update field:", error)
      setErrorMessage("Failed to update field. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-800 dark:to-slate-900">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Edit Field Configuration</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Update & Re-extract</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-white/80 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Changing the field name or type will trigger a new extraction from Azure AI
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Field Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={editedFieldName}
              onChange={(e) => setEditedFieldName(e.target.value)}
              className="w-full"
              placeholder="e.g., Invoice Number, Total Amount"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The name of the field to extract from the document
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Field Type <span className="text-red-500">*</span>
            </label>
            <select
              value={editedFieldType}
              onChange={(e) => setEditedFieldType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The data type helps Azure AI better understand what to extract
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Value:</p>
            <p className="text-sm text-slate-900 dark:text-white font-medium">{field.value || "(empty)"}</p>
            {field.confidence !== null && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Confidence: {(field.confidence * 100).toFixed(1)}%
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-slate-700 dark:text-slate-200"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving || !hasChanges} 
            className="gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Re-extracting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Save & Re-extract
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
