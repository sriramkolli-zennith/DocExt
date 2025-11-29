"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, ChevronRight, FileText, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          label: 'Completed',
          className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30'
        }
      case 'processing':
        return {
          icon: Clock,
          label: 'Processing',
          className: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30'
        }
      case 'failed':
        return {
          icon: AlertCircle,
          label: 'Failed',
          className: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30'
        }
      default:
        return {
          icon: Clock,
          label: 'Pending',
          className: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/30'
        }
    }
  }

  const statusConfig = getStatusConfig(document.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-lg hover:shadow-slate-200/80 dark:hover:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden">
      <Link href={`/documents/${document.id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 shrink-0">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {document.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Calendar className="h-3 w-3" />
                {createdDate}
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${statusConfig.className}`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </span>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 pb-5 pt-0">
        <Link href={`/documents/${document.id}`} className="flex-1">
          <Button
            size="sm"
            className="w-full h-9 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all rounded-xl"
          >
            <span>View Details</span>
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(document.id)
          }}
          className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
