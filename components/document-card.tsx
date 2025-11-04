"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ChevronRight, FileText, Calendar } from "lucide-react"
import { format } from "date-fns"

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
  const createdDate = new Date(document.created_at)

  return (
    <Card className="hover:shadow-lg transition-shadow group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-lg line-clamp-2">{document.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(createdDate, "MMM dd, yyyy")}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Status</p>
            <p className="font-medium capitalize">{document.status}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/document/${document.id}`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition gap-2 bg-transparent"
              >
                <span>View Details</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(document.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
