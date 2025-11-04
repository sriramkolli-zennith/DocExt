"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"
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

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }
        setUser(user)

        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Database error:", error.message || error)
          // Don't throw, just set empty array
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

    fetchDocuments()
  }, [])

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

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Documents</h1>
            <p className="text-muted-foreground">Manage and extract data from your documents</p>
          </div>
          <Link href="/extract">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Extraction
            </Button>
          </Link>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">Start by uploading a document to extract data</p>
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
  )
}
