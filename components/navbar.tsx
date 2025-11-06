"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { FileText, LayoutDashboard, User, FileStack } from "lucide-react"
import { createClient } from "@/lib/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
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

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <FileText className="h-6 w-6 text-primary" />
          <span>DocExtract</span>
        </Link>

        <div className="flex items-center gap-4">
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
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
