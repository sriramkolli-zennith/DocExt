"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface FieldValidationModalProps {
  isOpen: boolean
  field: {
    id: string
    fieldId: string
    fieldName: string
    value: string
    confidence: number | null
  }
  documentUrl: string
  onClose: () => void
  onFieldValueChange: (fieldId: string, newValue: string) => void
}

export default function FieldValidationModal({
  isOpen,
  field,
  documentUrl,
  onClose,
  onFieldValueChange,
}: FieldValidationModalProps) {
  const [editedValue, setEditedValue] = useState(field.value)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Use fieldId (the actual database ID) for the update
      await onFieldValueChange(field.fieldId, editedValue)
      onClose()
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{field.fieldName}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-2 hover:bg-gray-200 dark:hover:bg-slate-700">
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
          {/* Document Preview - Left Side */}
          <div className="lg:flex-1 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 min-h-[300px] sm:min-h-[400px]">
            {documentUrl.endsWith(".pdf") ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  PDF document<br />Download to view full content
                </p>
              </div>
            ) : (
              <img
                src={documentUrl || "/placeholder.svg"}
                alt="Document"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Field Value Editor - Right Side */}
          <div className="lg:w-96 flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300 font-semibold">Edit Value</Label>
              <textarea
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none transition-colors"
                rows={8}
                placeholder="Enter the correct value..."
              />
            </div>

            {field.confidence && (
              <div className="space-y-2 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confidence Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        field.confidence > 0.8 
                          ? "bg-green-500" 
                          : field.confidence > 0.6 
                          ? "bg-yellow-500" 
                          : "bg-red-500"
                      }`}
                      style={{ width: `${field.confidence * 100}%` }} 
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                    {(field.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-auto pt-4">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
