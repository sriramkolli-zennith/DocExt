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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
          <span className="text-lg sm:text-xl font-bold">DocExtract</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-9 w-20 sm:w-24" />
              <Skeleton className="h-9 w-20 sm:w-24" />
            </div>
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">Dashboard</Button>
                <Button variant="outline" size="sm" className="sm:hidden">Dashboard</Button>
              </Link>
              <Link href="/account/profile">
                <Button size="sm">Profile</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Sign Up</Button>
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
