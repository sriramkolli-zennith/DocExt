"use client"

import { Button } from "@/components/ui/button"
import { FileText, X, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface DuplicateDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  duplicateDocumentId: string
  duplicateDocumentName: string
  fileName: string
}

export function DuplicateDocumentModal({
  isOpen,
  onClose,
  onContinue,
  duplicateDocumentId,
  duplicateDocumentName,
  fileName,
}: DuplicateDocumentModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleVisitDocument = () => {
    router.push(`/documents/${duplicateDocumentId}`)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/60 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <FileText className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Duplicate Document Found</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                This file already exists in your documents
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-slate-200 dark:hover:bg-slate-700 -mr-2 -mt-2"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              <span className="font-semibold">File name:</span> {fileName}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Existing document:</span> {duplicateDocumentName}
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            A document with the same file name has already been uploaded. Would you like to visit the existing document or upload anyway?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <Button
            onClick={handleVisitDocument}
            className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Existing Document
          </Button>
          <Button
            onClick={onContinue}
            variant="outline"
            className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Upload Anyway
          </Button>
        </div>
      </div>
    </div>
  )
}
