"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { useSessionManager } from "@/lib/useSessionManager"
import { SessionWarningModal } from "@/components/session-warning-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Github, Mail } from "lucide-react"
import Navbar from "@/components/navbar"

export const dynamic = "force-dynamic"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Initialize session manager for activity tracking and timeout
  const { showWarning, extendSession } = useSessionManager()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }
        setUser(user)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError
        }

        if (profileData) {
          setProfile(profileData)
          setFullName(profileData.full_name || "")
          setUsername(profileData.username || "")
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username: username,
        })
        .eq("id", user.id)

      if (error) throw error
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  const oauthProviders = user?.identities?.map((id: any) => id.provider) || []
  const isGithubLinked = oauthProviders.includes("github")
  const isGoogleLinked = oauthProviders.includes("google")

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <Navbar />
      <SessionWarningModal open={showWarning} onExtend={extendSession} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <CardTitle className="text-2xl sm:text-3xl text-gray-900 dark:text-white">Account Settings</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Manage your profile information and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6 sm:pt-8">
            {/* Profile Information */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white disabled:opacity-60"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-900 dark:text-white">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-900 dark:text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">Minimum 3 characters</p>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully!</p>}

              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-60">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>

            {/* OAuth Connections */}
            <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Connected Accounts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Email Authentication</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Primary login method</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">✓ Connected</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-gray-900 dark:text-white" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">GitHub</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Alternative login method</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isGithubLinked ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                    {isGithubLinked ? "✓ Connected" : "Not connected"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Google</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Alternative login method</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isGoogleLinked ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                    {isGoogleLinked ? "✓ Connected" : "Not connected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-gray-200 dark:border-slate-600 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h3>
              <Button variant="destructive" onClick={handleLogout} className="gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
