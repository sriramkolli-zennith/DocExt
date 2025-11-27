"use client"

import { Button } from "@/components/ui/button"
import { X, Check, TrendingUp } from "lucide-react"

interface Alternative {
  value: string
  confidence: number
  pageNumber: number
  isOriginal?: boolean
  index?: number
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500'
    if (confidence >= 0.8) return 'bg-blue-500'
    if (confidence >= 0.7) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100'
    if (confidence >= 0.8) return 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100'
    if (confidence >= 0.7) return 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-100'
    return 'bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100'
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Select Correct Value</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="font-medium text-blue-600">{fieldName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {currentValue && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Currently Displayed Value:
              </p>
              <div className="p-4 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-900 text-lg">{currentValue}</p>
              </div>
            </div>
          )}

          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Alternative Values from Azure (click to select):
          </p>

          <div className="space-y-3">
            {alternatives && alternatives.length > 0 ? alternatives.map((alt, index) => (
              <button
                key={index}
                onClick={() => onSelectAlternative(alt.index !== undefined ? alt.index : index)}
                className={`w-full text-left p-5 border-2 rounded-xl transition-all group relative overflow-hidden ${getConfidenceBgColor(alt.confidence)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white shadow-sm border">
                        #{index + 1}
                      </span>
                      {alt.confidence >= 0.9 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300">
                          High Confidence
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-lg mb-3 break-words">{alt.value}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Confidence:</span>
                        <span className="font-bold text-base">{(alt.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Page:</span>
                        <span className="font-bold">{alt.pageNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="p-2 rounded-full border-2 border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-500 transition-all shadow-sm">
                      <Check className="h-5 w-5 text-transparent group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getConfidenceColor(alt.confidence)}`}
                      style={{ width: `${alt.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </button>
            )) : null}
          </div>

          {(!alternatives || alternatives.length === 0) && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <X className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No alternative values available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full py-3 border-gray-300 hover:bg-gray-100 font-medium"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
