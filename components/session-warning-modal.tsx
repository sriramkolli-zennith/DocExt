"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SessionWarningModalProps {
  open: boolean
  onExtend: () => void
}

export function SessionWarningModal({ open, onExtend }: SessionWarningModalProps) {
  const router = useRouter()

  if (!open) return null

  const handleLogout = () => {
    router.push("/auth/login?reason=session-expired")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 border border-yellow-200 dark:border-yellow-900">
        <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
          Session Expiring Soon
        </h2>
        <p className="text-foreground mb-6">
          Your session will expire in 5 minutes due to inactivity. Would you like to continue your session?
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900"
          >
            Logout
          </Button>
          <Button
            onClick={onExtend}
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            Continue Session
          </Button>
        </div>
      </div>
    </div>
  )
}
