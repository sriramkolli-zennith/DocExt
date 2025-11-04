"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Shield, Zap, ArrowRight } from "lucide-react"

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

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-20 text-center md:py-32">
        <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl text-balance">Extract Document Data with AI</h1>
        <p className="mb-8 text-lg text-muted-foreground max-w-2xl text-balance">
          Powered by Azure Document Intelligence, extract structured data from your documents instantly and accurately.
        </p>
        <Link href="/auth/sign-up">
          <Button size="lg" className="gap-2">
            Get Started <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose DocExtract?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-start gap-4 p-6 rounded-lg border bg-card">
              <Zap className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Extract data from documents in seconds using AI-powered recognition.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-start gap-4 p-6 rounded-lg border bg-card">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and stored securely. We never share your documents.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-start gap-4 p-6 rounded-lg border bg-card">
              <FileText className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Multi-Document</h3>
              <p className="text-muted-foreground">Process multiple documents at once and extract custom fields.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Extract?</h2>
          <p className="mb-8 text-lg">Start extracting document data with AI today.</p>
          <Link href="/auth/sign-up">
            <Button variant="secondary" size="lg">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 md:px-12 border-t bg-muted/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2025 DocExtract. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
