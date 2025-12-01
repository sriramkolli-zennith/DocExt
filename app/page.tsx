"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { HomeHero, HomeFeatures, HomeHowItWorks, HomeTrustedBy, HomeUseCases, HomeCallToAction, HomeFooter } from "@/components/home-sections"
import { createClient } from "@/lib/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                How it Works
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Privacy
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              ) : user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/account/profile">
                    <Button size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg font-medium shadow-sm">
                      Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg font-medium shadow-sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950">
            <div className="px-4 py-4 space-y-3">
              <Link href="#features" className="block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2">
                Features
              </Link>
              <Link href="#how-it-works" className="block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2">
                How it Works
              </Link>
              <Link href="/privacy" className="block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2">
                Privacy
              </Link>
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full justify-center">Dashboard</Button>
                    </Link>
                    <Link href="/account/profile">
                      <Button className="w-full justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900">Profile</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full justify-center">Sign in</Button>
                    </Link>
                    <Link href="/auth/sign-up">
                      <Button className="w-full justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Sections */}
      <HomeHero user={user} loading={loading} />
      <HomeTrustedBy />
      <HomeFeatures />
      <HomeUseCases />
      <HomeHowItWorks />
      <HomeCallToAction user={user} />
      <HomeFooter />
    </div>
  )
}
