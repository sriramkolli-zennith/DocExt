/**
 * Common hooks and utilities for state management and error handling
 */

import { useState, useCallback } from "react"

export interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook for managing async operations with loading and error states
 * Reduces boilerplate in components handling API calls
 */
export function useAsync<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  })

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, isLoading: true, error: null })
    try {
      const result = await asyncFunction()
      setState({ data: result, isLoading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setState({ data: null, isLoading: false, error: errorMessage })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: initialData, isLoading: false, error: null })
  }, [initialData])

  return { ...state, execute, reset }
}

/**
 * Helper to format error messages from various error types
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unexpected error occurred"
}

/**
 * Common field validation helper
 */
export function validateField(value: string | null | undefined, fieldName: string): string | null {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`
  }
  return null
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address"
  }
  return null
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long"
  }
  return null
}
