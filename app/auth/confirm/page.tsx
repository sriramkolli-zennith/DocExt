"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      
      const token_hash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      if (!token_hash || type !== "signup") {
        setStatus("error")
        setMessage("Invalid confirmation link")
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "signup",
        })

        if (error) {
          setStatus("error")
          setMessage(error.message || "Failed to confirm email")
        } else {
          setStatus("success")
          setMessage("Email confirmed successfully! Redirecting to dashboard...")
          
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-10 bg-slate-50 dark:bg-slate-950">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
        </Link>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/60 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 pb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />}
              {status === "success" && <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
              {status === "error" && <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />}
              {status === "loading" && "Confirming Email..."}
              {status === "success" && "Email Confirmed!"}
              {status === "error" && "Confirmation Failed"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">{message}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {status === "error" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  The confirmation link may have expired or is invalid.
                </p>
                <div className="flex gap-2">
                  <Button asChild className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 font-semibold rounded-xl">
                    <Link href="/auth/sign-up">Sign Up Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                </div>
              </div>
            )}
            {status === "success" && (
              <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/25 font-semibold rounded-xl">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-10 bg-slate-50 dark:bg-slate-950">
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 w-full max-w-md">
            <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
            </Link>
            <Card className="bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200/60 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 pb-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                  Loading...
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
