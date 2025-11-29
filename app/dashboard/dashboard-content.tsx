"use client"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { useSessionManager } from "@/lib/useSessionManager"
import { SessionWarningModal } from "@/components/session-warning-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText, TrendingUp, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import DocumentCard from "@/components/document-card"
import { CustomAlert } from "@/components/custom-alert"

interface Document {
  id: string
  name: string
  storage_path: string
  status: string
  created_at: string
  processed_at: string | null
}

interface Stats {
  total: number
  completed: number
  processing: number
  failed: number
  successRate: number
}

interface DashboardContentProps {
  initialDocuments: Document[]
  initialStats: Stats
}

export default function DashboardContent({ initialDocuments, initialStats }: DashboardContentProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [stats, setStats] = useState<Stats>(initialStats)
  const supabase = createClient()
  
  // Initialize session manager for activity tracking and timeout
  const { showWarning, extendSession } = useSessionManager()

  // Custom alert states
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string
    description?: string
    type: "success" | "error" | "warning" | "info"
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
  }>({
    title: "",
    type: "info",
  })

  // Helper functions for custom alerts
  const showAlert = (
    title: string,
    description?: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlertConfig({ title, description, type })
    setAlertOpen(true)
  }

  const showConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    type: "warning" | "error" = "warning",
    confirmText: string = "Confirm",
    cancelText: string = "Cancel"
  ) => {
    setAlertConfig({ title, description, type, onConfirm, confirmText, cancelText })
    setAlertOpen(true)
  }

  const handleDelete = async (documentId: string) => {
    showConfirm(
      "Delete Document",
      "Are you sure you want to delete this document? This action cannot be undone.",
      async () => {
        try {
          const { error } = await supabase.from("documents").delete().eq("id", documentId)
          if (error) throw error
          
          const updatedDocuments = documents.filter((doc) => doc.id !== documentId)
          setDocuments(updatedDocuments)

          // Recalculate stats
          const completed = updatedDocuments.filter(d => d.status === "completed").length
          const processing = updatedDocuments.filter(d => d.status === "processing").length
          const failed = updatedDocuments.filter(d => d.status === "failed").length
          const total = updatedDocuments.length
          const successRate = total > 0 ? (completed / total) * 100 : 0

          setStats({ total, completed, processing, failed, successRate })
          showAlert("Document Deleted", "The document has been successfully deleted.", "success")
        } catch (error) {
          console.error("Failed to delete document:", error)
          showAlert("Delete Failed", "Failed to delete document. Please try again.", "error")
        }
      },
      "error",
      "Delete",
      "Cancel"
    )
  }

  const recentDocs = documents.slice(0, 3)

  return (
    <>
      <SessionWarningModal open={showWarning} onExtend={extendSession} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Overview of your document extraction activity</p>
          </div>
          <Link href="/extract" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl">
              <Plus className="h-5 w-5" />
              New Extraction
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none p-5 sm:p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Total Documents</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
                <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none p-5 sm:p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none p-5 sm:p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Processing</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.processing}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none p-5 sm:p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Success Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.successRate.toFixed(0)}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-50 dark:from-indigo-500/20 dark:to-violet-500/10">
                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Recent Uploads</h2>
          {recentDocs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm">
              <div className="py-8 sm:py-12 text-center">
                <p className="text-slate-500 dark:text-slate-400">No documents yet. Start your first extraction!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${
                        doc.status === "completed" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30" :
                        doc.status === "processing" ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30" :
                        doc.status === "failed" ? "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30" :
                        "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* All Documents */}
        <div className="mt-10 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">All Documents</h2>
          {documents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 mb-4">
                  <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">No documents yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">Start by uploading a document to extract data</p>
                <Link href="/extract">
                  <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl">
                    <Plus className="h-4 w-4" />
                    Create Your First Extraction
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Alert Dialog */}
      <CustomAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title={alertConfig.title}
        description={alertConfig.description}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </>
  )
}
