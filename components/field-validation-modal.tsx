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
    if (confidence >= 0.9) {
      return 'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:hover:border-green-500/60'
    }
    if (confidence >= 0.8) {
      return 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:border-blue-500/60'
    }
    if (confidence >= 0.7) {
      return 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:hover:border-yellow-500/60'
    }
    return 'bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:hover:border-orange-500/60'
  }

  const hasAlternatives = Array.isArray(alternatives) && alternatives.length > 0
  const alternativeCount = hasAlternatives ? alternatives.length : 0
  const gridColumns = alternativeCount > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/70">
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wide mb-1">Select the best value</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{fieldName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close validation modal"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50 dark:bg-slate-950">
          {currentValue && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Currently displayed value
              </p>
              <div className="p-4 bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl shadow-sm">
                <p className="font-semibold text-gray-900 dark:text-white text-base break-words leading-snug">{currentValue}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Top {Math.min(alternativeCount, 3)} alternative values from Azure
            </p>

            {hasAlternatives ? (
              <div className={`grid gap-3 ${gridColumns}`}>
                {alternatives.map((alt, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectAlternative(alt.index !== undefined ? alt.index : index)}
                    className={`relative w-full text-left p-4 rounded-xl border transition-all group ${getConfidenceBgColor(alt.confidence)} dark:border-slate-700 dark:bg-slate-900/80`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Option {index + 1}</span>
                      <span>{(alt.confidence * 100).toFixed(1)}% confidence</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-white leading-snug break-words">
                      {alt.value}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>Page {alt.pageNumber}</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">Apply this value</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-white/60 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getConfidenceColor(alt.confidence)}`}
                        style={{ width: `${Math.min(alt.confidence * 100, 100)}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-500/60" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl">
                <div className="inline-block p-4 bg-white dark:bg-slate-900 rounded-full mb-4 border border-gray-200 dark:border-slate-700">
                  <X className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No alternative values available</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-900"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
