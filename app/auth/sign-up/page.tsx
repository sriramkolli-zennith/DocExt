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
import { signupSchema } from "@/lib/validations"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate with Zod
    const validation = signupSchema.safeParse({ email, password, confirmPassword })
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      setError(firstError.message)
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await createClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      if (data?.user && data?.session) {
        router.push("/dashboard")
      } else {
        router.push("/auth/sign-up-success")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: "google" | "github") => {
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
      title="Create Account"
      description="Sign up to start extracting documents"
      isLoading={isLoading}
      error={error}
      onOAuthLogin={handleOAuthSignUp}
      bottomLink={{ text: "Already have an account?", href: "/auth/login", label: "Login" }}
    >
      <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
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
          <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
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
          <p className="text-xs text-gray-600 dark:text-gray-400">
            At least 8 characters, 1 uppercase letter, and 1 number
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-white">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-60" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </form>
    </AuthForm>
  )
}
