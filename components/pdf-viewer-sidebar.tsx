"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [countdown, setCountdown] = useState<number>(10)

  // Function to start auto-close timer after scroll completes
  const startAutoCloseTimer = useCallback(() => {
    // Reset countdown
    setCountdown(10)
    
    // Clear any existing timers
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    
    console.log('⏱️ Starting 10-second auto-close timer')
    
    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Set timer to auto-close after 10 seconds
    autoCloseTimerRef.current = setTimeout(() => {
      onClose()
    }, 10000)
  }, [onClose])

  // Cleanup timers when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isOpen])

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

  // Function to scroll to annotation center
  const scrollToAnnotation = useCallback((pageNum: number, bbox: number[]) => {
    const pageElement = pageRefs.current.get(pageNum)
    const container = scrollContainerRef.current
    
    if (!pageElement || !container || !bbox || bbox.length < 8) {
      console.log('⚠️ Cannot scroll: missing elements')
      return
    }

    const pageDimensions = pageDimensionsRef.current.get(pageNum)
    if (!pageDimensions) {
      console.log(`⚠️ Page ${pageNum} dimensions not available for scroll`)
      // Fallback to simple scroll
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => startAutoCloseTimer(), 1000)
      return
    }

    const width = pageElement.clientWidth
    const height = pageElement.clientHeight
    const scaleX = width / pageDimensions.width
    const scaleY = height / pageDimensions.height

    const POINTS_PER_INCH = 72
    const isNormalized = bbox[0] <= 1 && bbox[1] <= 1

    let centerX = 0
    let centerY = 0
    const numPoints = bbox.length / 2

    for (let i = 0; i < bbox.length; i += 2) {
      let xInPoints, yInPoints
      
      if (isNormalized) {
        xInPoints = bbox[i] * pageDimensions.width
        yInPoints = bbox[i + 1] * pageDimensions.height
      } else {
        xInPoints = bbox[i] * POINTS_PER_INCH
        yInPoints = bbox[i + 1] * POINTS_PER_INCH
      }
      
      centerX += xInPoints * scaleX
      centerY += yInPoints * scaleY
    }
    centerX /= numPoints
    centerY /= numPoints

    console.log(`📍 Scrolling to annotation center: [${centerX.toFixed(0)}, ${centerY.toFixed(0)}]px`)

    const pageRect = pageElement.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const relativeTop = pageRect.top - containerRect.top + container.scrollTop
    const scrollTarget = relativeTop + centerY - (containerRect.height / 2)

    container.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: 'smooth'
    })

    // Start auto-close timer after scroll
    setTimeout(() => startAutoCloseTimer(), 1000)
  }, [startAutoCloseTimer])

  // Set current page when sidebar opens
  useEffect(() => {
    if (isOpen && pageNumber && pageNumber > 0) {
      setCurrentPage(pageNumber)
    }
  }, [isOpen, pageNumber])

  useEffect(() => {
    console.log('🧹 Clearing dimensions and canvas (pdfUrl changed):', pdfUrl)
    pageDimensionsRef.current.clear()
    canvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext("2d")
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    })
    setNumPages(0)
    setPdfLoading(true)
    setPdfError(false)
  }, [pdfUrl])

  // Main effect: Draw annotation first, then scroll to it
  useEffect(() => {
    if (boundingBox && pageNumber && isOpen && !pdfLoading && !pdfError) {
      latestBoundingBoxRef.current = boundingBox
      
      console.log('🎯 Starting annotation sequence: waiting for dimensions')
      
      // Poll for dimensions to be available
      let attempts = 0
      const maxAttempts = 20 // 2 seconds total
      
      const checkAndDraw = () => {
        const pageDimensions = pageDimensionsRef.current.get(pageNumber)
        
        if (pageDimensions) {
          console.log('✅ Dimensions available, starting draw → scroll sequence')
          
          // Step 1: Draw annotation
          console.log('📝 Step 1: Drawing annotation')
          drawAnnotation(pageNumber, boundingBox)
          
          // Step 2: Scroll to annotation immediately after draw
          console.log('📜 Step 2: Scrolling to annotation')
          requestAnimationFrame(() => {
            scrollToAnnotation(pageNumber, boundingBox)
          })
        } else if (attempts < maxAttempts) {
          attempts++
          console.log(`⏳ Waiting for dimensions... attempt ${attempts}/${maxAttempts}`)
          setTimeout(checkAndDraw, 100)
        } else {
          console.log('❌ Dimensions not available after max attempts')
        }
      }
      
      // Start checking after a small initial delay
      const timer = setTimeout(checkAndDraw, 100)

      return () => clearTimeout(timer)
    }
    if (!boundingBox && isOpen) {
      clearAllCanvases()
    }
  }, [boundingBox, pageNumber, isOpen, pdfLoading, pdfError, scrollToAnnotation])

  // Redraw annotation when scale changes
  useEffect(() => {
    if (boundingBox && pageNumber && isOpen && !pdfLoading && latestBoundingBoxRef.current) {
      const redrawTimeout = setTimeout(() => {
        drawAnnotation(pageNumber, latestBoundingBoxRef.current!)
      }, 300)
      return () => clearTimeout(redrawTimeout)
    }
  }, [scale])

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

  const scrollToPage = useCallback((page: number) => {
    const pageElement = pageRefs.current.get(page)
    const container = scrollContainerRef.current
    
    if (pageElement && container && boundingBox && boundingBox.length >= 8) {
      // Calculate the center position of the bounding box
      const pageDimensions = pageDimensionsRef.current.get(page)
      if (!pageDimensions) {
        // Fallback to simple center scroll if dimensions not available
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      const width = pageElement.clientWidth
      const height = pageElement.clientHeight
      const scaleX = width / pageDimensions.width
      const scaleY = height / pageDimensions.height

      // Calculate bounding box center in viewport coordinates
      let centerX = 0
      let centerY = 0
      const numPoints = boundingBox.length / 2

      for (let i = 0; i < boundingBox.length; i += 2) {
        centerX += boundingBox[i] * scaleX
        centerY += boundingBox[i + 1] * scaleY
      }
      centerX /= numPoints
      centerY /= numPoints

      // Get page position relative to container
      const pageRect = pageElement.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      
      // Calculate scroll position to center the bounding box
      const relativeTop = pageRect.top - containerRect.top + container.scrollTop
      const scrollTarget = relativeTop + centerY - (containerRect.height / 2)

      // Smooth scroll to center the field
      container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth'
      })
    } else if (pageElement && container) {
      // Fallback if no bounding box
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [boundingBox])

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

    // Auto-detect coordinate format and convert
    const POINTS_PER_INCH = 72
    const isNormalized = bbox[0] <= 1 && bbox[1] <= 1
    
    const scaleX = width / pageDimensions.width
    const scaleY = height / pageDimensions.height

    console.log(`🎨 Drawing on page ${page}:`, {
      bbox: bbox.slice(0, 8),
      format: isNormalized ? 'normalized' : 'inches',
      pageDimensions,
      viewport: { width, height },
      scale: { scaleX: scaleX.toFixed(3), scaleY: scaleY.toFixed(3) }
    })
    console.log(`📐 Coordinate conversion: Azure (top-left origin) → PDF points → Viewport pixels`)

    const points: Array<{ x: number; y: number }> = []

    for (let i = 0; i < bbox.length; i += 2) {
      let xInPoints, yInPoints
      
      if (isNormalized) {
        xInPoints = bbox[i] * pageDimensions.width
        yInPoints = bbox[i + 1] * pageDimensions.height
      } else {
        // Azure coordinates are in inches from top-left
        xInPoints = bbox[i] * POINTS_PER_INCH
        yInPoints = bbox[i + 1] * POINTS_PER_INCH
      }
      
      // Scale to viewport size (no Y-flip needed, Azure uses top-left origin like canvas)
      const x = xInPoints * scaleX
      const y = yInPoints * scaleY

      points.push({ x, y })
      console.log(points);
      // Log first point for debugging
      if (i === 0) {
        console.log(`  First point: [${bbox[i]}, ${bbox[i+1]}] inches → [${xInPoints.toFixed(1)}, ${yInPoints.toFixed(1)}] points from top → [${x.toFixed(1)}, ${y.toFixed(1)}] pixels`)
      }
    }

    if (points.length === 0) return

    // Draw static annotation first
    const drawStatic = () => {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)
      
      ctx.beginPath()
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      })
      ctx.closePath()

      // Use dark yellow background with no border
      ctx.fillStyle = "rgba(202, 138, 4, 0.5)" // Dark yellow with transparency
      ctx.lineWidth = 0
      ctx.fill()
      ctx.restore()
    }

    drawStatic()

    // Add a pulsing animation effect (only for first 2 seconds)
    let pulseOpacity = 1
    let pulseDirection = -1
    let frameCount = 0
    const maxFrames = 120 // 2 seconds at 60fps

    const animatePulse = () => {
      if (frameCount >= maxFrames) {
        // After animation, ensure static version remains
        drawStatic()
        return
      }

      pulseOpacity += pulseDirection * 0.02
      if (pulseOpacity <= 0.5) {
        pulseDirection = 1
      } else if (pulseOpacity >= 1) {
        pulseDirection = -1
      }

      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.scale(dpr, dpr)
      
      ctx.beginPath()
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      })
      ctx.closePath()

      // Dark yellow pulsing animation with no border
      ctx.fillStyle = `rgba(202, 138, 4, ${pulseOpacity * 0.5})` // Dark yellow with pulsing opacity
      ctx.lineWidth = 0
      ctx.fill()
      ctx.restore()

      frameCount++
      if (frameCount < maxFrames) {
        requestAnimationFrame(animatePulse)
      } else {
        // Ensure static annotation remains after animation
        drawStatic()
      }
    }

    // Start pulse animation after a short delay
    setTimeout(() => animatePulse(), 200)
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
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen bg-white dark:bg-slate-900 border-l border-gray-300 dark:border-slate-700 shadow-2xl z-[70] transition-all duration-300 ease-out ${
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
            <span className={`text-xs font-semibold px-2 py-1 rounded ${getHighlightBadgeColor()}`}>
              {getConfidenceLabel()}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {numPages}
            </span>
            <span className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${matchBadgeClass}`}>
              {matchBadgeText}
            </span>
            {countdown > 0 && boundingBox && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 animate-pulse">
                Auto-close in {countdown}s
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0 h-8 w-8 rounded-full border-2 border-black dark:border-white bg-gray-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900 hover:border-red-600 dark:hover:border-red-400 ml-2"
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
                          console.log(`✅ Page ${page} dimensions captured:`, { width: viewport.width, height: viewport.height })

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
      </div>
    </>
  )
}
