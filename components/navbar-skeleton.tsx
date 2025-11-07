"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function NavbarSkeleton() {
  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo Skeleton */}
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="hidden sm:block h-6 w-32" />
        </div>

        {/* Nav Links Skeleton (desktop) */}
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
  )
}
