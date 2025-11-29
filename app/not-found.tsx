import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Home, FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Minimal centered content */}
      <div className="text-center max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
        </Link>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-2xl scale-150" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border border-indigo-100 dark:border-indigo-900/50">
              <FileQuestion className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* 404 badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 mb-6">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Error 404</span>
        </div>

        {/* Text */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Single primary action */}
        <Link href="/">
          <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl px-8 h-11 font-medium shadow-lg shadow-slate-900/10 dark:shadow-white/10 transition-all">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Secondary link */}
        <p className="mt-8 text-sm text-slate-400 dark:text-slate-500">
          or go to{" "}
          <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
