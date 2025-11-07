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
    return `flex items-center gap-2 text-sm transition ${
      isActive(href)
        ? "text-primary font-semibold"
        : "text-muted-foreground hover:text-foreground"
    }`
  }

  if (loading) {
    return <NavbarSkeleton />
  }

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="hidden sm:inline">DocExtract</span>
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
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">Sign Up</Button>
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
        <div className="md:hidden border-t bg-card">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <div className={navLinkClass("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link
                  href="/documents"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <div className={navLinkClass("/documents")}>
                    <FileStack className="h-4 w-4" />
                    <span>Documents</span>
                  </div>
                </Link>
                <Link
                  href="/account/profile"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
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
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
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
