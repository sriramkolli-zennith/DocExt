"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { FileText, Github } from "lucide-react"

interface AuthFormProps {
  title: string
  description: string
  isLoading: boolean
  error: string | null
  children: React.ReactNode
  bottomLink: {
    text: string
    href: string
    label: string
  }
  showOAuth?: boolean
  onOAuthLogin?: (provider: "google" | "github") => void
}

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

export default function AuthForm({
  title,
  description,
  isLoading,
  error,
  children,
  bottomLink,
  showOAuth = true,
  onOAuthLogin,
}: AuthFormProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12 bg-white dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8 sm:mb-10">
          <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">DocExtract</span>
        </div>

        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <CardTitle className="text-2xl sm:text-3xl text-gray-900 dark:text-white">{title}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 sm:pt-8">
            <div className="space-y-4">
              {children}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            {showOAuth && (
              <>
                <div className="relative my-4 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-gray-600 dark:text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOAuthLogin?.("google")}
                    className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <GoogleIcon />
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOAuthLogin?.("github")}
                    className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>
              </>
            )}

            <div className="mt-4 sm:mt-6 text-center text-sm text-gray-900 dark:text-white">
              {bottomLink.text}{" "}
              <Link href={bottomLink.href} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                {bottomLink.label}
              </Link>
            </div>
            {title === "Login" && (
              <div className="mt-4 text-center text-sm">
                <Link href="/auth/forgot-password" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Forgot password?
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
