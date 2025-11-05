"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, LayoutDashboard, User, FileStack } from "lucide-react"
import { createClient } from "@/lib/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

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
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link
                href="/documents"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <FileStack className="h-4 w-4" />
                <span className="text-sm">Documents</span>
              </Link>
              <Link
                href="/account/profile"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <User className="h-4 w-4" />
                <span className="text-sm">Profile</span>
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
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
