import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-10 bg-slate-50 dark:bg-slate-950">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
        </Link>

        <Card className="bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 rounded-2xl overflow-hidden">
          <CardHeader className="text-center border-b border-slate-200/60 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 pb-6">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20">
                <Mail className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Check Your Email</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">We sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-6">
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
