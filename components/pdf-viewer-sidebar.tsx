"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { X, AlertCircle, ZoomIn, ZoomOut } from "lucide-react"
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
  labelPageNumber?: number
  labelBoundingBox?: number[]
}

type HighlightTarget = {
  pageNumber: number
  boundingBox: number[]
  kind: "value" | "label"
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
  labelPageNumber,
  labelBoundingBox,
}: PDFViewerSidebarProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [pdfError, setPdfError] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [countdown, setCountdown] = useState<number>(0)

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pageDimensionsRef = useRef<Map<number, { width: number; height: number }>>(new Map())
  const latestAnnotationsRef = useRef<HighlightTarget[]>([])
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const annotationTargets = useMemo<HighlightTarget[]>(() => {
    const targets: HighlightTarget[] = []

    const hasValueTarget =
      typeof pageNumber === "number" && Array.isArray(boundingBox) && boundingBox.length >= 8
    if (hasValueTarget) {
      targets.push({ pageNumber, boundingBox, kind: "value" })
    }

    const hasLabelTarget =
      typeof labelPageNumber === "number" &&
      Array.isArray(labelBoundingBox) &&
      labelBoundingBox.length >= 8
    if (hasLabelTarget) {
      targets.push({
        pageNumber: labelPageNumber,
        boundingBox: labelBoundingBox,
        kind: "label",
      })
    }

    return targets
  }, [pageNumber, boundingBox, labelPageNumber, labelBoundingBox])

  const clearAllCanvases = useCallback(() => {
    canvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
  }, [])

  const drawAnnotations = useCallback((page: number, highlights: HighlightTarget[]) => {
    if (highlights.length === 0) return

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

    const POINTS_PER_INCH = 72
    const scaleX = width / pageDimensions.width
    const scaleY = height / pageDimensions.height

    const shapes = highlights
      .map((highlight) => {
        const bbox = highlight.boundingBox
        if (!Array.isArray(bbox) || bbox.length < 8) return null

        const isNormalized = bbox[0] <= 1 && bbox[1] <= 1
        const points: Array<{ x: number; y: number }> = []

        for (let i = 0; i < bbox.length; i += 2) {
          let xInPoints, yInPoints
          if (isNormalized) {
            xInPoints = bbox[i] * pageDimensions.width
            yInPoints = bbox[i + 1] * pageDimensions.height
          } else {
            xInPoints = bbox[i] * POINTS_PER_INCH
            yInPoints = bbox[i + 1] * POINTS_PER_INCH
          }

          const x = xInPoints * scaleX
          const y = yInPoints * scaleY
          points.push({ x, y })
        }

        if (points.length === 0) return null
        return { kind: highlight.kind, points }
      })
      .filter(Boolean) as Array<{ kind: HighlightTarget["kind"]; points: Array<{ x: number; y: number }> }>

    if (shapes.length === 0) return

    const renderShapes = (valueOpacity = 1) => {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)

      shapes.forEach(({ kind, points }) => {
        ctx.beginPath()
        points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        })
        ctx.closePath()

        const baseOpacity = kind === "value" ? 0.5 : 0.35
        const fillOpacity = kind === "value" ? baseOpacity * valueOpacity : baseOpacity
        const fillColor =
          kind === "value"
            ? `rgba(202, 138, 4, ${fillOpacity})`
            : `rgba(59, 130, 246, ${fillOpacity})`
        ctx.fillStyle = fillColor
        ctx.lineWidth = 0
        ctx.fill()
      })

      ctx.restore()
    }

    renderShapes()

    const shouldPulse = shapes.some((shape) => shape.kind === "value")
    if (!shouldPulse) {
      return
    }

    let pulseOpacity = 1
    let pulseDirection = -1
    let frameCount = 0
    const maxFrames = 120

    const animatePulse = () => {
      if (frameCount >= maxFrames) {
        renderShapes()
        return
      }

      pulseOpacity += pulseDirection * 0.02
      if (pulseOpacity <= 0.5) {
        pulseDirection = 1
      } else if (pulseOpacity >= 1) {
        pulseDirection = -1
      }

      renderShapes(pulseOpacity)
      frameCount++
      if (frameCount < maxFrames) {
        requestAnimationFrame(animatePulse)
      } else {
        renderShapes()
      }
    }

    setTimeout(() => animatePulse(), 200)
  }, [])

  const drawAllCurrentAnnotations = useCallback(() => {
    const annotations = latestAnnotationsRef.current
    if (annotations.length === 0) {
      clearAllCanvases()
      return
    }

    const pages = Array.from(new Set(annotations.map((target) => target.pageNumber)))
    pages.forEach((page) => {
      const pageTargets = annotations.filter((target) => target.pageNumber === page)
      drawAnnotations(page, pageTargets)
    })
  }, [clearAllCanvases, drawAnnotations])

  const scrollToPage = useCallback(
    (page: number) => {
      const pageElement = pageRefs.current.get(page)
      const container = scrollContainerRef.current
      const pageTarget =
        annotationTargets.find((t) => t.pageNumber === page && t.kind === "value") ??
        annotationTargets.find((t) => t.pageNumber === page)

      if (pageElement && container && pageTarget && pageTarget.boundingBox.length >= 8) {
        const pageDimensions = pageDimensionsRef.current.get(page)
        if (!pageDimensions) {
          pageElement.scrollIntoView({ behavior: "smooth", block: "center" })
          return
        }

        const width = pageElement.clientWidth
        const height = pageElement.clientHeight
        const scaleX = width / pageDimensions.width
        const scaleY = height / pageDimensions.height

        let centerX = 0
        let centerY = 0
        const bbox = pageTarget.boundingBox
        const numPoints = bbox.length / 2

        for (let i = 0; i < bbox.length; i += 2) {
          centerX += bbox[i] * scaleX
          centerY += bbox[i + 1] * scaleY
        }
        centerX /= numPoints
        centerY /= numPoints

        const pageRect = pageElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        const relativeTop = pageRect.top - containerRect.top + container.scrollTop
        const scrollTarget = relativeTop + centerY - containerRect.height / 2

        container.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: "smooth",
        })
      } else if (pageElement && container) {
        pageElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    },
    [annotationTargets]
  )

  // Function to start auto-close timer after scroll completes
  const clearTimers = useCallback(() => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
  }, [])

  const startAutoCloseTimer = useCallback(() => {
    clearTimers()
    setCountdown(7)
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    autoCloseTimerRef.current = setTimeout(onClose, 7000)
  }, [onClose, clearTimers])

  // Cleanup timers and handle escape key
  useEffect(() => {
    if (!isOpen) {
      clearTimers()
      setCountdown(0)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, clearTimers])

  const scrollToAnnotation = useCallback((pageNum: number, bbox: number[]) => {
    const pageElement = pageRefs.current.get(pageNum)
    const container = scrollContainerRef.current
    
    if (!pageElement || !container || !bbox || bbox.length < 8) return

    const pageDimensions = pageDimensionsRef.current.get(pageNum)
    if (!pageDimensions) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(startAutoCloseTimer, 1000)
      return
    }

    const width = pageElement.clientWidth
    const height = pageElement.clientHeight
    const scaleX = width / pageDimensions.width
    const scaleY = height / pageDimensions.height
    const POINTS_PER_INCH = 72
    const isNormalized = bbox[0] <= 1 && bbox[1] <= 1

    let centerX = 0, centerY = 0
    for (let i = 0; i < bbox.length; i += 2) {
      const xInPoints = isNormalized ? bbox[i] * pageDimensions.width : bbox[i] * POINTS_PER_INCH
      const yInPoints = isNormalized ? bbox[i + 1] * pageDimensions.height : bbox[i + 1] * POINTS_PER_INCH
      centerX += xInPoints * scaleX
      centerY += yInPoints * scaleY
    }
    centerX /= bbox.length / 2
    centerY /= bbox.length / 2

    const pageRect = pageElement.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const scrollTarget = pageRect.top - containerRect.top + container.scrollTop + centerY - containerRect.height / 2

    container.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    setTimeout(startAutoCloseTimer, 1000)
  }, [startAutoCloseTimer])

  // Initialize page and clear on URL change
  useEffect(() => {
    if (isOpen && pageNumber && pageNumber > 0) setCurrentPage(pageNumber)
  }, [isOpen, pageNumber])

  useEffect(() => {
    pageDimensionsRef.current.clear()
    canvasRefs.current.forEach((canvas) => canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height))
    setNumPages(0)
    setPdfLoading(true)
    setPdfError(false)
  }, [pdfUrl])

  // Main effect: draw annotations and scroll to primary target
  useEffect(() => {
    if (!isOpen || pdfLoading || pdfError) return

    if (annotationTargets.length === 0) {
      latestAnnotationsRef.current = []
      clearAllCanvases()
      return
    }

    latestAnnotationsRef.current = annotationTargets
    let attempts = 0

    const waitForDimensions = () => {
      const pendingPages = Array.from(new Set(annotationTargets.map((t) => t.pageNumber)))
      const readyPages = pendingPages.filter((page) => pageDimensionsRef.current.get(page))

      if (readyPages.length === pendingPages.length) {
        drawAllCurrentAnnotations()
        const primaryTarget = annotationTargets.find((t) => t.kind === "value") ?? annotationTargets[0]
        if (primaryTarget) {
          requestAnimationFrame(() => scrollToAnnotation(primaryTarget.pageNumber, primaryTarget.boundingBox))
        }
        return
      }

      if (attempts++ < 20) setTimeout(waitForDimensions, 100)
    }

    const timer = setTimeout(waitForDimensions, 100)
    return () => clearTimeout(timer)
  }, [annotationTargets, isOpen, pdfLoading, pdfError, drawAllCurrentAnnotations, scrollToAnnotation, clearAllCanvases])

  // Redraw on scale change, clear on close, and handle resize
  useEffect(() => {
    if (!isOpen) {
      clearAllCanvases()
      return
    }

    if (!pdfLoading && !pdfError && latestAnnotationsRef.current.length) {
      const redrawTimeout = setTimeout(drawAllCurrentAnnotations, 300)
      const handleResize = () => latestAnnotationsRef.current.length && drawAllCurrentAnnotations()
      window.addEventListener("resize", handleResize)
      
      return () => {
        clearTimeout(redrawTimeout)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [scale, isOpen, pdfLoading, pdfError, drawAllCurrentAnnotations, clearAllCanvases])

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

  const confidenceLevel = !confidence ? 0 : confidence > 0.8 ? 3 : confidence > 0.6 ? 2 : 1
  const confidenceBadgeColors = [
    "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "bg-gray-500 text-white dark:bg-gray-400 dark:text-gray-900",
    "bg-gray-400 text-gray-900 dark:bg-gray-500 dark:text-gray-100",
    "bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100"
  ]
  const confidenceLabels = ["No Data", "Low", "Medium", "High"]

  return (
    <>
      {/* Overlay - click to close on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen bg-card border-l border-gray-300 dark:border-slate-700 shadow-2xl z-[70] transition-all duration-300 ease-out ${
          isOpen ? "w-full lg:w-1/2" : "w-0"
        } overflow-hidden flex flex-col`}
      >
        {/* Controls Bar */}
        <div className="border-b border-gray-300 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between bg-gray-50 dark:bg-slate-800 sticky top-0 z-[75] shrink-0">
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
            <span className={`text-xs font-semibold px-2 py-1 rounded ${confidenceBadgeColors[confidenceLevel]}`}>
              {confidenceLabels[confidenceLevel]}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {numPages}
            </span>
            {countdown > 0 && annotationTargets.length > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 animate-pulse">
                Auto-close in {countdown}s
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 h-8 w-8 rounded-full border-2 border-black dark:border-white bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-gray-800 hover:border-gray-600 dark:hover:border-gray-400 ml-2"
              title="Close (ESC)"
            >
              <X className="h-5 w-5 text-black dark:text-white font-bold stroke-[3]" />
            </Button>
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
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-300 dark:border-slate-700 border-t-gray-900 dark:border-t-white"></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading PDF...</p>
              </div>
            </div>
          )}

          {pdfError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/20 z-20">
              <div className="text-center space-y-3 p-4 bg-card rounded-lg border border-gray-300 dark:border-gray-700">
                <AlertCircle className="h-10 w-10 text-gray-900 dark:text-white mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Failed to load PDF</p>
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
                  className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
                          pageDimensionsRef.current.set(page, { width: viewport.width, height: viewport.height })

                          const annotationsForPage = latestAnnotationsRef.current.filter((target) => target.pageNumber === page)
                          if (annotationsForPage.length > 0) {
                            requestAnimationFrame(() => drawAnnotations(page, annotationsForPage))
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
      </div>
    </>
  )
}