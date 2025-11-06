import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExtractLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      {/* Navbar Skeleton */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo Skeleton */}
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="hidden sm:block h-6 w-32" />
          </div>

          {/* Nav Links Skeleton */}
          <div className="hidden md:flex items-center gap-6">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>

          {/* Theme Toggle & Menu Skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="md:hidden h-10 w-10" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Main Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extraction Name Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* File Upload Area */}
              <div>
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>

              {/* Fields to Extract Section */}
              <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-10" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Field Button */}
              <Skeleton className="h-10 w-32" />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Extractions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
