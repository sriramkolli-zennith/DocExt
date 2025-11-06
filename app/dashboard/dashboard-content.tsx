"use client"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText, TrendingUp, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import DocumentCard from "@/components/document-card"

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

  const handleDelete = async (documentId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return

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
    } catch (error) {
      console.error("Failed to delete document:", error)
    }
  }

  const recentDocs = documents.slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your document extraction activity</p>
        </div>
        <Link href="/extract">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            New Extraction
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
        {recentDocs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No documents yet. Start your first extraction!
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
                        doc.status === "completed" ? "bg-green-100 text-green-700" :
                        doc.status === "processing" ? "bg-blue-100 text-blue-700" :
                        doc.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
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
  )
}
