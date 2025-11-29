"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useSessionManager } from "@/lib/useSessionManager"
import { SessionWarningModal } from "@/components/session-warning-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"
import { Plus, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const router = useRouter()
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

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchQuery, statusFilter])

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error:", error.message)
        setDocuments([])
      } else {
        setDocuments(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => doc.status === statusFilter)
    }

    setFilteredDocuments(filtered)
  }

  const handleDelete = async (documentId: string) => {
    showConfirm(
      "Delete Document",
      "Are you sure you want to delete this document? This action cannot be undone.",
      async () => {
        try {
          const { error } = await supabase.from("documents").delete().eq("id", documentId)
          if (error) throw error
          setDocuments(documents.filter((doc) => doc.id !== documentId))
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading documents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar />
      <SessionWarningModal open={showWarning} onExtend={extendSession} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Documents</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Browse and manage all your documents</p>
          </div>
          <Link href="/extract" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl">
              <Plus className="h-5 w-5" />
              New Extraction
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 sm:mb-10 space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 w-full text-sm sm:text-base bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-300 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              {["all", "completed", "processing", "failed", "pending"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className={`whitespace-nowrap text-xs sm:text-sm rounded-xl font-medium transition-all ${
                    statusFilter === status 
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25" 
                      : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 mb-4">
                <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                {documents.length === 0 ? "No documents yet" : "No results found"}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-6 text-sm sm:text-base max-w-md">
                {documents.length === 0
                  ? "Start by uploading a document to extract data"
                  : "Try adjusting your search or filters"}
              </p>
              {documents.length === 0 && (
                <Link href="/extract">
                  <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl">
                    <Plus className="h-4 w-4" />
                    Create Your First Extraction
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
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
    </div>
  )
}
