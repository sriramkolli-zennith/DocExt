"use client"

import { useState, useEffect, useRef } from "react"
import { X, AlertCircle, ZoomIn, ZoomOut, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PDFViewerSidebarProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  fieldName: string
  fieldValue: string
  confidence?: number
  pageNumber?: number
  boundingBox?: number[]
}

export function PDFViewerSidebar({
  isOpen,
  onClose,
  pdfUrl,
  fieldName,
  fieldValue,
  confidence,
  pageNumber,
  boundingBox,
}: PDFViewerSidebarProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [pdfError, setPdfError] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Navigate to page and scroll when sidebar opens
  useEffect(() => {
    if (isOpen && pageNumber && pageNumber > 0) {
      setCurrentPage(pageNumber)
      // Delay scroll to ensure page is rendered
      setTimeout(() => {
        scrollToPage(pageNumber)
      }, 500)
    }
  }, [isOpen, pageNumber])

  // Draw annotation when bounding box and page are available
  useEffect(() => {
    if (boundingBox && pageNumber && isOpen && !pdfLoading) {
      setTimeout(() => {
        drawAnnotation(pageNumber, boundingBox)
      }, 600)
    }
  }, [boundingBox, pageNumber, isOpen, pdfLoading, scale])

  const scrollToPage = (page: number) => {
    const pageElement = pageRefs.current.get(page)
    if (pageElement && scrollContainerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const drawAnnotation = (page: number, bbox: number[]) => {
    const canvas = canvasRefs.current.get(page)
    if (!canvas || bbox.length < 8) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear previous annotations
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Azure polygon format: [x1, y1, x2, y2, x3, y3, x4, y4]
    // Coordinates are in PDF space (72 DPI, origin at bottom-left)
    // We need to convert to canvas space (origin at top-left)
    
    const pageElement = pageRefs.current.get(page)
    if (!pageElement) return

    const pageHeight = pageElement.clientHeight
    const pageWidth = pageElement.clientWidth

    // Get the PDF page dimensions from the data attributes or calculate
    // For now, assume standard US Letter size (612x792 points)
    const pdfWidth = 612
    const pdfHeight = 792

    // Scale factors
    const scaleX = pageWidth / pdfWidth
    const scaleY = pageHeight / pdfHeight

    // Convert bounding box coordinates
    const convertedCoords = []
    for (let i = 0; i < bbox.length; i += 2) {
      const x = bbox[i] * scaleX
      // Flip Y coordinate (PDF origin is bottom-left, canvas is top-left)
      const y = pageHeight - (bbox[i + 1] * scaleY)
      convertedCoords.push({ x, y })
    }

    // Draw the bounding box
    ctx.beginPath()
    ctx.moveTo(convertedCoords[0].x, convertedCoords[0].y)
    for (let i = 1; i < convertedCoords.length; i++) {
      ctx.lineTo(convertedCoords[i].x, convertedCoords[i].y)
    }
    ctx.closePath()

    // Set style based on confidence
    if (confidence && confidence > 0.8) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)' // green
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    } else if (confidence && confidence > 0.6) {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.8)' // yellow
      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'
    } else {
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)' // blue
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
    }
    
    ctx.lineWidth = 3
    ctx.fill()
    ctx.stroke()

    // Add flash animation
    let opacity = 0.8
    let fadeOut = false
    const animate = () => {
      if (fadeOut) {
        opacity -= 0.02
        if (opacity <= 0.15) opacity = 0.15
      } else {
        opacity += 0.02
        if (opacity >= 0.8) fadeOut = true
      }
      
      drawAnnotation(page, bbox)
      
      if (opacity > 0.15 || !fadeOut) {
        requestAnimationFrame(animate)
      }
    }
    
    // Start animation once
    setTimeout(() => animate(), 100)
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPdfLoading(false)
    setPdfError(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setPdfError(true)
    setPdfLoading(false)
  }

  // Get highlight color based on confidence
  const getHighlightColor = () => {
    if (!confidence) return "bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600"
    if (confidence > 0.8) return "bg-green-50 dark:bg-green-950/30 border-green-400 dark:border-green-600"
    if (confidence > 0.6) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-400 dark:border-yellow-600"
    return "bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-600"
  }

  const getHighlightBadgeColor = () => {
    if (!confidence) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
    if (confidence > 0.8) return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
    if (confidence > 0.6) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
  }

  const getConfidenceLabel = () => {
    if (!confidence) return "No Data"
    if (confidence > 0.8) return "High"
    if (confidence > 0.6) return "Medium"
    return "Low"
  }

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

        {/* Controls Bar */}
        <div className="border-b border-gray-300 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-800 sticky top-[72px] z-40 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              disabled={scale <= 0.5}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
              disabled={scale >= 2.0}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${getHighlightBadgeColor()}`}>
              {getConfidenceLabel()}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {numPages}
            </span>
          </div>
        </div>

        {/* PDF Viewer Section */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-950 relative"
        >
          {pdfLoading && !pdfError && (
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
                    setPdfLoading(true)
                  }}
                  className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* PDF Display Container */}
          <div className="w-full h-full p-2 sm:p-4 flex flex-col items-center">
            {pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
              >
                {Array.from(new Array(numPages), (el, index) => {
                  const page = index + 1
                  return (
                    <div
                      key={`page_${page}`}
                      ref={(el) => {
                        if (el) pageRefs.current.set(page, el)
                      }}
                      className="relative mb-4"
                      id={`pdf-page-${page}`}
                    >
                      <Page
                        pageNumber={page}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-lg border border-gray-300 dark:border-slate-700"
                        onLoadSuccess={() => {
                          if (page === pageNumber && boundingBox) {
                            setTimeout(() => drawAnnotation(page, boundingBox), 200)
                          }
                        }}
                      />
                      <canvas
                        ref={(el) => {
                          if (el) canvasRefs.current.set(page, el)
                        }}
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    </div>
                  )
                })}
              </Document>
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
            <p className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Extracted Value
            </p>
            <p className={`text-gray-900 dark:text-white break-words line-clamp-3 border-l-4 pl-3 py-2 rounded font-medium ${getHighlightColor()}`}>
              {fieldValue}
            </p>
            {pageNumber && boundingBox && (
              <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-2">
                📍 Found on page {pageNumber} - Highlighted in document
              </p>
            )}
          </div>
          {confidence !== undefined && (
            <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Confidence Level</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${getHighlightBadgeColor()}`}>
                    {getConfidenceLabel()}
                  </span>
                </div>
                <p className="font-bold text-blue-600 dark:text-blue-400">{(confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
