"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { HomeHero, HomeFeatures, HomeCallToAction, HomeFooter } from "@/components/home-sections"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">DocExtract</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* Page Sections */}
      <HomeHero />
      <HomeFeatures />
      <HomeCallToAction />
      <HomeFooter />
    </div>
  )
}
