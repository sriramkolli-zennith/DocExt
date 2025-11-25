"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ChevronRight, FileText, Calendar } from "lucide-react"

interface DocumentCardProps {
  document: {
    id: string
    name: string
    storage_path: string
    status: string
    created_at: string
    processed_at: string | null
  }
  onDelete: (id: string) => void
}

export default function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const createdDate = new Date(document.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card className="hover:shadow-lg transition-shadow group overflow-hidden bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <Link href={`/documents/${document.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-900 dark:text-white shrink-0" />
                <CardTitle className="text-lg line-clamp-2 text-gray-900 dark:text-white">{document.name}</CardTitle>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                {createdDate}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Status</p>
              <p className="font-medium capitalize text-gray-900 dark:text-white">{document.status}</p>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Link href={`/documents/${document.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black border-0 transition gap-2"
            >
              <span>View Details</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onDelete(document.id)
            }}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
