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
    if (!window.confirm("Are you sure you want to delete this document?")) return

    try {
      const { error } = await supabase.from("documents").delete().eq("id", documentId)
      if (error) throw error
      setDocuments(documents.filter((doc) => doc.id !== documentId))
    } catch (error) {
      console.error("Failed to delete document:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <Navbar />
      <SessionWarningModal open={showWarning} onExtend={extendSession} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Documents</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Browse and manage all your documents</p>
          </div>
          <Link href="/extract" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
              <Plus className="h-5 w-5" />
              New Extraction
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 sm:mb-10 space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full text-sm sm:text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              {["all", "completed", "processing", "failed", "pending"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className={`whitespace-nowrap text-xs sm:text-sm ${
                    statusFilter === status 
                      ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 text-white" 
                      : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
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
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {documents.length === 0 ? "No documents yet" : "No results found"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-sm sm:text-base">
                {documents.length === 0
                  ? "Start by uploading a document to extract data"
                  : "Try adjusting your search or filters"}
              </p>
              {documents.length === 0 && (
                <Link href="/extract">
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Create Your First Extraction
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
