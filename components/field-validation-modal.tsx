"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface FieldValidationModalProps {
  isOpen: boolean
  field: {
    id: string
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
    await onFieldValueChange(field.id, editedValue)
    setIsSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{field.fieldName}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-4 p-6">
          {/* Document Preview - Left Side */}
          <div className="lg:flex-1 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
            {documentUrl.endsWith(".pdf") ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">PDF document - download to view full content</p>
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
          <div className="lg:w-80 flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Extracted Value</Label>
              <textarea
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={6}
              />
            </div>

            {field.confidence && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${field.confidence * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium">{(field.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
