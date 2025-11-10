"use client"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setIsSuccess(true)
    } catch (error: any) {
      setError(error.message || "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="text-center border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                      <div className="mb-6 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-gray-900 dark:text-white">Check Your Email</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              We've sent a password reset link to {email}
            </CardDescription>
          </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 p-4 sm:p-6">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <CardTitle className="text-gray-900 dark:text-white">Forgot Password</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 sm:pt-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-60" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
