"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PDFViewerSidebarProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  fieldName: string
  fieldValue: string
  confidence?: number
}

export function PDFViewerSidebar({
  isOpen,
  onClose,
  pdfUrl,
  fieldName,
  fieldValue,
  confidence,
}: PDFViewerSidebarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)
  const [searchQuery, setSearchQuery] = useState(fieldValue)

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  // Update search query when field value changes
  useEffect(() => {
    setSearchQuery(fieldValue)
  }, [fieldValue])

  return (
    <>
      {/* Overlay - click to close on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen bg-white dark:bg-slate-900 border-l border-gray-300 dark:border-slate-700 shadow-2xl z-40 transition-all duration-300 ease-out ${
          isOpen ? "w-full lg:w-1/2" : "w-0"
        } overflow-hidden flex flex-col`}
      >
        {/* Header with Close Button */}
        <div className="border-b border-gray-300 dark:border-slate-700 px-4 sm:px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-50 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-bold text-base sm:text-lg truncate text-gray-900 dark:text-white">{fieldName}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{fieldValue}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 h-9 w-9 rounded-full"
            title="Close (ESC)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-gray-300 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center gap-2 bg-gray-50 dark:bg-slate-800 sticky top-[72px] z-40 shrink-0">
          <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in PDF..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap font-medium">Ctrl+F</p>
        </div>

        {/* PDF Viewer Section */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-950 relative">
          {isLoading && !pdfError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-slate-950/90 z-20">
              <div className="text-center space-y-3">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-300 dark:border-slate-700 border-t-blue-500 dark:border-t-blue-400"></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading PDF...</p>
              </div>
            </div>
          )}

          {pdfError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 dark:bg-red-950/20 z-20">
              <div className="text-center space-y-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-red-200 dark:border-red-900">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed to load PDF</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {pdfUrl || "No URL provided"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPdfError(false)
                    setIsLoading(true)
                  }}
                  className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* PDF Display Container */}
          <div className="w-full h-full p-2 sm:p-4 flex items-center justify-center">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full rounded-lg border border-gray-300 dark:border-slate-700 shadow-lg"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false)
                  setPdfError(true)
                }}
                title={`PDF Viewer - ${fieldName}`}
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                <AlertCircle className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No PDF URL available</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Field Info */}
        <div className="border-t border-gray-300 dark:border-slate-700 px-4 sm:px-6 py-4 bg-white dark:bg-slate-800 text-xs space-y-3 sticky bottom-0 shrink-0 max-h-[30vh] overflow-y-auto">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Field Name</p>
            <p className="text-gray-600 dark:text-gray-400 break-words">{fieldName}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Extracted Value</p>
            <p className="text-gray-600 dark:text-gray-400 break-words line-clamp-3 bg-yellow-50 dark:bg-yellow-950/30 border-l-4 border-yellow-400 dark:border-yellow-600 pl-3 py-2 rounded">
              {fieldValue}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2">
              💡 Use search bar above or press <kbd className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">Ctrl+F</kbd> to highlight
            </p>
          </div>
          {confidence !== undefined && (
            <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Confidence</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">{(confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden h-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    confidence > 0.8
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : confidence > 0.6
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : "bg-gradient-to-r from-red-500 to-rose-500"
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
