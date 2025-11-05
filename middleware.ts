import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/dashboard", "/extract", "/documents", "/account", "/templates"]
const AUTH_PATHS = ["/auth/login", "/auth/sign-up"]

const isPathMatch = (pathname: string, paths: string[]) => paths.some((path) => pathname.startsWith(path))

export async function middleware(request: NextRequest) {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, skip middleware and allow request
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isProtectedPath = isPathMatch(pathname, PROTECTED_PATHS)
    const isAuthPath = isPathMatch(pathname, AUTH_PATHS)

    // Redirect to login if accessing protected path without auth
    if (isProtectedPath && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect to dashboard if already logged in and accessing auth pages
    if (isAuthPath && user) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error, allow the request to proceed
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
