"use client"

import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"

interface Alternative {
  value: string
  confidence: number
  pageNumber: number
}

interface FieldValidationModalProps {
  isOpen: boolean
  fieldName: string
  currentValue: string
  alternatives: Alternative[]
  onClose: () => void
  onSelectAlternative: (index: number) => void
}

export default function FieldValidationModal({
  isOpen,
  fieldName,
  currentValue,
  alternatives,
  onClose,
  onSelectAlternative,
}: FieldValidationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Select Correct Value</h2>
            <p className="text-sm text-gray-600 mt-1">{fieldName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current value:</p>
            <div className="p-3 bg-gray-50 border rounded-lg">
              <p className="font-medium">{currentValue}</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-700 mb-3">
            Alternative values found:
          </p>

          <div className="space-y-3">
            {alternatives && alternatives.length > 0 ? alternatives.map((alt, index) => (
              <button
                key={index}
                onClick={() => onSelectAlternative(index)}
                className="w-full text-left p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{alt.value}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Confidence: {(alt.confidence * 100).toFixed(1)}%</span>
                      <span>Page: {alt.pageNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="p-1 rounded-full border-2 border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-500 transition-all">
                      <Check className="h-4 w-4 text-transparent group-hover:text-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${alt.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            )) : null}
          </div>

          {(!alternatives || alternatives.length === 0) && (
            <p className="text-gray-500 text-center py-8">
              No alternative values available
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
