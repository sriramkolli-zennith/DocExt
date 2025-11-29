"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { HomeHero, HomeFeatures, HomeCallToAction, HomeFooter } from "@/components/home-sections"
import { createClient } from "@/lib/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-9 w-20 sm:w-24 rounded-xl" />
              <Skeleton className="h-9 w-20 sm:w-24 rounded-xl" />
            </div>
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">Dashboard</Button>
              </Link>
              <Link href="/account/profile">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 rounded-xl font-semibold">Profile</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">Login</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 rounded-xl font-semibold">Sign Up</Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>

      {/* Page Sections */}
      <HomeHero user={user} loading={loading} />
      <HomeFeatures />
      <HomeCallToAction />
      <HomeFooter />
    </div>
  )
}
