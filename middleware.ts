import { type NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/dashboard", "/extract", "/documents", "/account"]

const isPathMatch = (pathname: string, paths: string[]) => paths.some((path) => pathname.startsWith(path))

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtectedPath = isPathMatch(pathname, PROTECTED_PATHS)

  // Only check protected paths - let auth pages handle their own logic
  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // Check for Supabase auth cookie (this is a simple presence check, not validation)
  // The cookie name pattern for Supabase is: sb-<project-ref>-auth-token
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  )

  // Redirect to login if accessing protected path without auth cookie
  if (isProtectedPath && !hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
