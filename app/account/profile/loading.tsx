import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { ArrowLeft, Mail, Github } from "lucide-react"

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Settings</CardTitle>
            <CardDescription>Manage your profile information and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Profile Information Skeleton */}
            <div className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-4 w-36" />
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>

              {/* Save Button */}
              <Skeleton className="h-10 w-32" />
            </div>

            {/* OAuth Connections Skeleton */}
            <div className="border-t pt-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                {/* Email Authentication */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>

                {/* Google */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                    </svg>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>

            {/* Danger Zone Skeleton */}
            <div className="border-t pt-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
