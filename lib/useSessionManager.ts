import { useEffect, useRef } from "react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"

const SESSION_TIMEOUT = 3 * 60 * 60 * 1000 // 3 hours in milliseconds

export function useSessionManager() {
  const supabase = createClient()
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    // Set session timeout (3 hours)
    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut()
      router.push("/auth/login?reason=session-expired")
    }, SESSION_TIMEOUT)
  }

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        resetTimer()
      }
    }

    checkSession()

    // Reset timer on user activity
    const handleActivity = () => {
      resetTimer()
    }

    // Listen for activity
    window.addEventListener("mousedown", handleActivity)
    window.addEventListener("keydown", handleActivity)
    window.addEventListener("scroll", handleActivity, true)
    window.addEventListener("touchstart", handleActivity)

    return () => {
      window.removeEventListener("mousedown", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("scroll", handleActivity, true)
      window.removeEventListener("touchstart", handleActivity)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [])
}
