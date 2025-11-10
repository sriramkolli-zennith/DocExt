"use client"

import type React from "react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import AuthForm from "@/components/auth-form"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { loginSchema } from "@/lib/validations"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate with Zod
    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      setError(firstError.message)
      return
    }

    setIsLoading(true)

    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setError(null)
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  return (
    <AuthForm
      title="Login"
      description="Sign in to your account to continue"
      isLoading={isLoading}
      error={error}
      onOAuthLogin={handleOAuthLogin}
      bottomLink={{ text: "Don't have an account?", href: "/auth/sign-up", label: "Sign up" }}
    >
      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
            <Link href="/auth/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-60" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthForm>
  )
}
