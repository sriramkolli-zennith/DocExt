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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Overview of your document extraction activity</p>
          </div>
          <Link href="/extract" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black">
              <Plus className="h-5 w-5" />
              New Extraction
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 sm:mb-10">
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900 transition">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Total Documents</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-900 dark:text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900 transition">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Completed</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-900 dark:text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900 transition">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Processing</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.processing}</p>
                </div>
                <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-gray-900 dark:text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900 transition">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">Success Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.successRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-gray-900 dark:text-white opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Uploads */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Recent Uploads</h2>
          {recentDocs.length === 0 ? (
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardContent className="py-8 sm:py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">No documents yet. Start your first extraction!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <Card className="hover:shadow-md transition cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          doc.status === "completed" ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200" :
                          doc.status === "processing" ? "bg-gray-300 text-gray-900 dark:bg-gray-600 dark:text-gray-100" :
                          doc.status === "failed" ? "bg-gray-400 text-gray-900 dark:bg-gray-500 dark:text-gray-100" :
                          "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* All Documents */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">All Documents</h2>
          {documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-6">Start by uploading a document to extract data</p>
                <Link href="/extract">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Extraction
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
