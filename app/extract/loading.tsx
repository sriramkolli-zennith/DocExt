import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Navbar from "@/components/navbar"

export default function ExtractLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      <Navbar />
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
