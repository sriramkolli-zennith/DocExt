import { Suspense } from "react"
import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"
import { DashboardSkeleton } from "@/components/skeletons"
import DashboardContent from "@/app/dashboard/dashboard-content"

export const dynamic = "force-dynamic"

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

async function fetchDashboardData(userId: string): Promise<{ documents: Document[], stats: Stats }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Database error:", error.message || error)
    return { 
      documents: [], 
      stats: { total: 0, completed: 0, processing: 0, failed: 0, successRate: 0 } 
    }
  }

  const docs = data || []
  
  // Calculate stats
  const completed = docs.filter(d => d.status === "completed").length
  const processing = docs.filter(d => d.status === "processing").length
  const failed = docs.filter(d => d.status === "failed").length
  const total = docs.length
  const successRate = total > 0 ? (completed / total) * 100 : 0

  return {
    documents: docs,
    stats: { total, completed, processing, failed, successRate }
  }
}

async function DashboardDataWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const { documents, stats } = await fetchDashboardData(user.id)

  return <DashboardContent initialDocuments={documents} initialStats={stats} />
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <Navbar />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataWrapper />
      </Suspense>
    </div>
  )
}
