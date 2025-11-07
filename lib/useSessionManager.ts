import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"

const SESSION_TIMEOUT = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
const WARNING_TIME = 5 * 60 * 1000 // Warn 5 minutes before timeout
const ACTIVITY_DEBOUNCE = 1000 // Debounce activity for 1 second

export function useSessionManager() {
  const supabase = createClient()
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const [showWarning, setShowWarning] = useState(false)

  const handleTimeout = async () => {
    // Sign out user
    await supabase.auth.signOut()
    
    // Clear all timers and listeners
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    // Redirect to login
    router.push("/auth/login?reason=session-expired")
  }

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    
    // Hide warning when resetting
    setShowWarning(false)

    // Set warning timeout (3 hours - 5 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
    }, SESSION_TIMEOUT - WARNING_TIME)

    // Set session timeout (3 hours)
    timeoutRef.current = setTimeout(handleTimeout, SESSION_TIMEOUT)
  }

  const handleActivity = () => {
    const now = Date.now()
    
    // Debounce: Only reset if 1+ second has passed since last activity
    if (now - lastActivityRef.current < ACTIVITY_DEBOUNCE) {
      return
    }
    
    lastActivityRef.current = now
    resetTimer()
  }

  // Debounced activity handler
  const debouncedActivity = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      handleActivity()
    }, ACTIVITY_DEBOUNCE)
  }

  const extendSession = () => {
    setShowWarning(false)
    resetTimer()
  }

  useEffect(() => {
    // Check if user is logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // User not logged in, redirect
        router.push("/auth/login")
        return
      }

      // Session exists, start timeout
      resetTimer()
    }

    checkSession()

    // Listen for activity
    window.addEventListener("mousedown", debouncedActivity)
    window.addEventListener("keydown", debouncedActivity)
    window.addEventListener("scroll", debouncedActivity, true)
    window.addEventListener("touchstart", debouncedActivity)

    return () => {
      // Clean up event listeners
      window.removeEventListener("mousedown", debouncedActivity)
      window.removeEventListener("keydown", debouncedActivity)
      window.removeEventListener("scroll", debouncedActivity, true)
      window.removeEventListener("touchstart", debouncedActivity)

      // Clean up timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [supabase, router])

  return { showWarning, extendSession }
}
