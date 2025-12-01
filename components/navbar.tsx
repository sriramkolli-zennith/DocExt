"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { FileText, LayoutDashboard, User, FileStack, Menu, X } from "lucide-react"
import { createClient } from "@/lib/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import NavbarSkeleton from "@/components/navbar-skeleton"

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const navLinkClass = (href: string) => {
    return `flex items-center gap-2 text-sm transition-all ${
      isActive(href)
        ? "text-indigo-600 dark:text-indigo-400 font-semibold"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
    }`
  }

  if (loading) {
    return <NavbarSkeleton />
  }

  return (
    <nav className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 border-slate-200/60 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg shrink-0 text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/documents" className={navLinkClass("/documents")}>
                <FileStack className="h-4 w-4" />
                <span>Documents</span>
              </Link>
              <Link href="/account/profile" className={navLinkClass("/account/profile")}>
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 font-semibold">Sign Up</Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/80">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <div className={navLinkClass("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link
                  href="/documents"
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <div className={navLinkClass("/documents")}>
                    <FileStack className="h-4 w-4" />
                    <span>Documents</span>
                  </div>
                </Link>
                <Link
                  href="/account/profile"
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <div className={navLinkClass("/account/profile")}>
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
