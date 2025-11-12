"use client"

import { useState, useEffect, useRef } from "react"
import { X, AlertCircle, ZoomIn, ZoomOut, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Document, Page, pdfjs } from "react-pdf"
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api"

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

const normalizeForSearch = (input: string) =>
  input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

const shouldSkipMatchCounting = (value: string) => {
  const normalized = value.toLowerCase().trim()
  if (!normalized || normalized.length < 2) return true

  const discouragedValues = [
    "processing...",
    "processing",
    "not extracted",
    "extraction failed",
    "n/a",
  ]

  return discouragedValues.includes(normalized)
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
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const [isCountingMatches, setIsCountingMatches] = useState(false)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageDimensionsRef = useRef<Map<number, { width: number; height: number }>>(new Map())
  const latestBoundingBoxRef = useRef<number[] | undefined>(undefined)

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
      }, 800)
    }
  }, [isOpen, pageNumber])

  useEffect(() => {
    pageDimensionsRef.current.clear()
    canvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext("2d")
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    })
    setNumPages(0)
    setCurrentPage(pageNumber && pageNumber > 0 ? pageNumber : 1)
    setPdfLoading(true)
    setPdfError(false)
  }, [pdfUrl])

  // Draw annotation when bounding box and page are available
  useEffect(() => {
    if (boundingBox && pageNumber && isOpen && !pdfLoading && !pdfError) {
      latestBoundingBoxRef.current = boundingBox
      clearAllCanvases()
      const redrawTimeout = setTimeout(() => {
        drawAnnotation(pageNumber, boundingBox)
      }, 250)

      return () => clearTimeout(redrawTimeout)
    }
    if (!boundingBox) {
      clearAllCanvases()
    }
  }, [boundingBox, pageNumber, isOpen, pdfLoading, pdfError, scale])

  useEffect(() => {
    latestBoundingBoxRef.current = boundingBox
  }, [boundingBox])

  useEffect(() => {
    if (!isOpen) {
      clearAllCanvases()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !pageNumber) return

    const handleResize = () => {
      if (latestBoundingBoxRef.current) {
        drawAnnotation(pageNumber, latestBoundingBoxRef.current)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isOpen, pageNumber])

  useEffect(() => {
    if (!isOpen) return

    const container = scrollContainerRef.current
    if (!container || numPages === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visibleEntries.length === 0) return

        const target = visibleEntries[0].target as HTMLDivElement
        const pageAttr = target.getAttribute("data-page-number")
        const pageIndex = pageAttr ? Number(pageAttr) : NaN

        if (!Number.isNaN(pageIndex)) {
          setCurrentPage(pageIndex)
        }
      },
      { root: container, threshold: 0.4 }
    )

    pageRefs.current.forEach((element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [isOpen, numPages])

  useEffect(() => {
    if (!isOpen || !pdfUrl || !fieldValue) {
      setMatchCount(null)
      setIsCountingMatches(false)
      return
    }

    if (pdfLoading || pdfError || numPages === 0) {
      setMatchCount(null)
      setIsCountingMatches(false)
      return
    }

    if (shouldSkipMatchCounting(fieldValue)) {
      setMatchCount(null)
      setIsCountingMatches(false)
      return
    }

    const normalizedTerm = normalizeForSearch(fieldValue)
    if (!normalizedTerm) {
      setMatchCount(null)
      setIsCountingMatches(false)
      return
    }

    let cancelled = false
    let loadingTask: ReturnType<typeof pdfjs.getDocument> | null = null

    const countMatches = async () => {
      try {
        setIsCountingMatches(true)
        setMatchCount(null)

        loadingTask = pdfjs.getDocument({ url: pdfUrl })
        const pdfDocument = await loadingTask.promise
        loadingTask = null

        let totalMatches = 0

        for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex++) {
          if (cancelled) break

          const page = await pdfDocument.getPage(pageIndex)
          const textContent = await page.getTextContent()

          const combinedText = (textContent.items as Array<Record<string, unknown>>)
            .map((item) => {
              if (typeof item?.str === "string") return item.str as string
              if (typeof item?.text === "string") return item.text as string
              return ""
            })
            .join(" ")

          const normalizedText = normalizeForSearch(combinedText)
          if (!normalizedText) continue

          let fromIndex = normalizedText.indexOf(normalizedTerm)
          while (fromIndex !== -1) {
            totalMatches += 1
            fromIndex = normalizedText.indexOf(normalizedTerm, fromIndex + normalizedTerm.length)
          }
        }

        if (!cancelled) {
          setMatchCount(totalMatches)
        }

        await pdfDocument.destroy()
      } catch (error) {
        console.error("Match counting failed:", error)
        if (!cancelled) {
          setMatchCount(null)
        }
      } finally {
        if (!cancelled) {
          setIsCountingMatches(false)
        }
        if (loadingTask) {
          loadingTask.destroy()
        }
      }
    }

    countMatches()

    return () => {
      cancelled = true
      if (loadingTask) {
        loadingTask.destroy()
      }
    }
  }, [isOpen, pdfUrl, fieldValue, pdfLoading, pdfError, numPages])

  const scrollToPage = (page: number) => {
    const pageElement = pageRefs.current.get(page)
    if (pageElement && scrollContainerRef.current) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const clearAllCanvases = () => {
    canvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
  }

  const drawAnnotation = (page: number, bbox: number[]) => {
    if (!Array.isArray(bbox) || bbox.length < 8) return

    const canvas = canvasRefs.current.get(page)
    const pageElement = pageRefs.current.get(page)
    const pageDimensions = pageDimensionsRef.current.get(page)

    if (!canvas || !pageElement || !pageDimensions) return

    const width = pageElement.clientWidth
    const height = pageElement.clientHeight

    if (!width || !height) return

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

    const requiredWidth = width * dpr
    const requiredHeight = height * dpr

    if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
      canvas.width = requiredWidth
      canvas.height = requiredHeight
    }

    if (canvas.style.width !== `${width}px`) {
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)

    const scaleX = width / pageDimensions.width
    const scaleY = height / pageDimensions.height

    const points: Array<{ x: number; y: number }> = []
    let outOfBounds = 0

    for (let i = 0; i < bbox.length; i += 2) {
      const x = bbox[i] * scaleX
      const y = bbox[i + 1] * scaleY

      if (y < -1 || y > height + 1) {
        outOfBounds += 1
      }

      points.push({ x, y })
    }

    if (outOfBounds >= points.length / 2) {
      points.length = 0
      for (let i = 0; i < bbox.length; i += 2) {
        const x = bbox[i] * scaleX
        const flippedY = height - bbox[i + 1] * scaleY
        points.push({ x, y: flippedY })
      }
    }

    if (points.length === 0) return

    ctx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()

    let stroke = "rgba(59, 130, 246, 0.85)"
    let fill = "rgba(59, 130, 246, 0.18)"

    if (confidence && confidence > 0.8) {
      stroke = "rgba(34, 197, 94, 0.9)"
      fill = "rgba(34, 197, 94, 0.22)"
    } else if (confidence && confidence > 0.6) {
      stroke = "rgba(234, 179, 8, 0.9)"
      fill = "rgba(234, 179, 8, 0.22)"
    }

    ctx.lineWidth = 2.5
    ctx.lineJoin = "round"
    ctx.strokeStyle = stroke
    ctx.fillStyle = fill
    ctx.fill()
    ctx.stroke()
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPdfLoading(false)
    setPdfError(false)

     if (pageNumber && pageNumber > 0) {
      const targetPage = Math.min(pageNumber, numPages)
      setCurrentPage(targetPage)
      requestAnimationFrame(() => scrollToPage(targetPage))
    }
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

  const matchBadgeText = isCountingMatches
    ? "Scanning..."
    : matchCount === null
      ? "Matches --"
      : `Matches ${matchCount}`

  const matchBadgeClass = (() => {
    if (isCountingMatches) return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
    if (matchCount === null) return "bg-gray-100 text-gray-600 dark:bg-slate-800/60 dark:text-gray-300"
    if (matchCount === 0) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
  })()

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
            <span className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${matchBadgeClass}`}>
              {matchBadgeText}
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
                        else {
                          pageRefs.current.delete(page)
                          pageDimensionsRef.current.delete(page)
                        }
                      }}
                      className="relative mb-4"
                      id={`pdf-page-${page}`}
                      data-page-number={page}
                    >
                      <Page
                        pageNumber={page}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-lg border border-gray-300 dark:border-slate-700"
                        onLoadSuccess={(pageArg: any) => {
                          const loadedPage = pageArg as PDFPageProxy
                          const viewport = loadedPage.getViewport({ scale: 1 })
                          pageDimensionsRef.current.set(page, {
                            width: viewport.width,
                            height: viewport.height,
                          })

                          if (page === pageNumber && latestBoundingBoxRef.current) {
                            requestAnimationFrame(() => drawAnnotation(page, latestBoundingBoxRef.current!))
                          }
                        }}
                      />
                      <canvas
                        ref={(el) => {
                          if (el) canvasRefs.current.set(page, el)
                          else canvasRefs.current.delete(page)
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
