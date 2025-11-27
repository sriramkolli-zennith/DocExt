"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface EditableField {
  fieldId: string
  fieldName: string
  fieldType: string
  value: string
  confidence: number | null
}

interface FieldEditModalProps {
  isOpen: boolean
  field: EditableField | null
  onClose: () => void
  onFieldValueChange: (fieldId: string, newValue: string) => Promise<void> | void
}

export default function FieldEditModal({
  isOpen,
  field,
  onClose,
  onFieldValueChange,
}: FieldEditModalProps) {
  const [editedValue, setEditedValue] = useState(field?.value || "")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (field) {
      setEditedValue(field.value || "")
      setErrorMessage(null)
    }
  }, [field])

  if (!isOpen || !field) {
    return null
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editedValue.trim()) {
      setErrorMessage("Please enter a value before saving.")
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await onFieldValueChange(field.fieldId, editedValue.trim())
      onClose()
    } catch (error) {
      console.error("Failed to save field:", error)
      setErrorMessage("Failed to save field. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Editing field</p>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{field.fieldName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-xs font-semibold">
              {field.fieldType}
            </span>
            {field.confidence !== null && (
              <span>Confidence: {(field.confidence * 100).toFixed(1)}%</span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Field value
            </label>
            <textarea
              value={editedValue}
              onChange={(event) => setEditedValue(event.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the correct value"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-gray-700 dark:text-gray-200"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
