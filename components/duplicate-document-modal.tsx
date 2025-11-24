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
      <div className="bg-card rounded-lg max-w-md w-full shadow-2xl border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <FileText className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Duplicate Document Found</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This file already exists in your documents
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-gray-200 dark:hover:bg-slate-700 -mr-2 -mt-2"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <span className="font-semibold">File name:</span> {fileName}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Existing document:</span> {duplicateDocumentName}
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            A document with the same file name has already been uploaded. Would you like to visit the existing document or upload anyway?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <Button
            onClick={handleVisitDocument}
            className="flex-1 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Existing Document
          </Button>
          <Button
            onClick={onContinue}
            variant="outline"
            className="flex-1 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            Upload Anyway
          </Button>
        </div>
      </div>
    </div>
  )
}
