"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      
      // Get the token hash from URL
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
          
          // Redirect to dashboard after 2 seconds
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-linear-to-b from-background to-muted">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">DocExtract</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              {status === "loading" && "Confirming Email..."}
              {status === "success" && "Email Confirmed!"}
              {status === "error" && "Confirmation Failed"}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "error" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The confirmation link may have expired or is invalid.
                </p>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href="/auth/sign-up">Sign Up Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/auth/login">Login</Link>
                  </Button>
                </div>
              </div>
            )}
            {status === "success" && (
              <Button asChild className="w-full">
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
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-linear-to-b from-background to-muted">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-2 mb-8">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">DocExtract</span>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
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
