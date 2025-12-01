"use client"

import { Button } from "@/components/ui/button"
import { X, Check, Sparkles } from "lucide-react"

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
    if (confidence >= 0.9) return 'from-emerald-500 to-teal-500'
    if (confidence >= 0.8) return 'from-blue-500 to-indigo-500'
    if (confidence >= 0.7) return 'from-amber-400 to-orange-500'
    return 'from-rose-400 to-red-500'
  }

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 0.9) {
      return 'bg-emerald-50/80 border-emerald-200/60 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-500/30 dark:hover:border-emerald-500/60'
    }
    if (confidence >= 0.8) {
      return 'bg-blue-50/80 border-blue-200/60 hover:border-blue-400 hover:bg-blue-50 hover:shadow-blue-500/10 dark:bg-blue-950/30 dark:border-blue-500/30 dark:hover:border-blue-500/60'
    }
    if (confidence >= 0.7) {
      return 'bg-amber-50/80 border-amber-200/60 hover:border-amber-400 hover:bg-amber-50 hover:shadow-amber-500/10 dark:bg-amber-950/30 dark:border-amber-500/30 dark:hover:border-amber-500/60'
    }
    return 'bg-rose-50/80 border-rose-200/60 hover:border-rose-400 hover:bg-rose-50 hover:shadow-rose-500/10 dark:bg-rose-950/30 dark:border-rose-500/30 dark:hover:border-rose-500/60'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-700 dark:text-emerald-400'
    if (confidence >= 0.8) return 'text-blue-700 dark:text-blue-400'
    if (confidence >= 0.7) return 'text-amber-700 dark:text-amber-400'
    return 'text-rose-700 dark:text-rose-400'
  }

  const hasAlternatives = Array.isArray(alternatives) && alternatives.length > 0
  const alternativeCount = hasAlternatives ? alternatives.length : 0
  const gridColumns = alternativeCount > 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-slate-900/20 dark:shadow-black/40 border border-slate-200/60 dark:border-slate-800/80">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-slate-50/30 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-slate-900/50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 dark:bg-indigo-500/20">
                <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              </span>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Select the best value</p>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white break-words tracking-tight">{fieldName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close validation modal"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950">
          {currentValue && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                Current value
              </p>
              <div className="p-4 bg-white dark:bg-slate-900/80 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-base break-words leading-relaxed">{currentValue}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 dark:bg-indigo-500/20">
                <svg className="h-3 w-3 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </span>
              Top {Math.min(alternativeCount, 3)} alternatives from AI
            </p>

            {hasAlternatives ? (
              <div className={`grid gap-4 ${gridColumns}`}>
                {alternatives.map((alt, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectAlternative(alt.index !== undefined ? alt.index : index)}
                    className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group hover:shadow-lg cursor-pointer ${getConfidenceBgColor(alt.confidence)}`}
                  >
                    {/* Option badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/60">
                        Option {index + 1}
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${getConfidenceText(alt.confidence)}`}>
                        {(alt.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    {/* Value */}
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-relaxed break-words mb-4">
                      {alt.value}
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Page {alt.pageNumber}</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                        Apply →
                      </span>
                    </div>
                    
                    {/* Confidence bar */}
                    <div className="mt-4 h-1.5 bg-white/80 dark:bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getConfidenceColor(alt.confidence)} rounded-full transition-all`}
                        style={{ width: `${Math.min(alt.confidence * 100, 100)}%` }}
                      />
                    </div>
                    
                    {/* Hover ring */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-indigo-500/40 transition-all" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30">
                <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
                  <X className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-semibold">No alternatives available</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">The AI couldn&apos;t find other values for this field</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
