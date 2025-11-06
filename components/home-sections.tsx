import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Shield, FileText, ArrowRight } from "lucide-react"

export function HomeHero({ user, loading }: { user: any; loading: boolean }) {
  return (
    <section className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-20 lg:py-32 text-center">
      <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl lg:text-6xl font-bold text-balance leading-tight">
        Extract Document Data with AI
      </h1>
      <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground max-w-2xl text-balance">
        Powered by Azure Document Intelligence, extract structured data from your documents instantly and accurately.
      </p>
      <Link href={user ? "/dashboard" : "/auth/sign-up"}>
        <Button size="lg" className="gap-2 w-full sm:w-auto" disabled={loading}>
          {loading ? "Loading..." : user ? "Go to Dashboard" : "Get Started"} {!loading && <ArrowRight className="h-5 w-5" />}
        </Button>
      </Link>
    </section>
  )
}

interface FeatureProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureProps) {
  return (
    <div className="flex flex-col items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex-shrink-0">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
    </div>
  )
}

export function HomeFeatures() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Lightning Fast",
      description: "Extract data from documents in seconds using AI-powered recognition.",
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely. We never share your documents.",
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Multi-Document",
      description: "Process multiple documents at once and extract custom fields.",
    },
  ]

  return (
    <section className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">Why Choose DocExtract?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeCallToAction() {
  return (
    <section className="px-4 sm:px-6 lg:px-12 py-16 sm:py-20 bg-primary text-primary-foreground">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Ready to Extract?</h2>
        <p className="mb-6 sm:mb-8 text-base sm:text-lg">Start extracting document data with AI today.</p>
        <Link href="/auth/sign-up">
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            Start Free Trial
          </Button>
        </Link>
      </div>
    </section>
  )
}

export function HomeFooter() {
  return (
    <footer className="px-4 sm:px-6 lg:px-12 py-8 border-t bg-muted/50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <p className="text-xs sm:text-sm text-muted-foreground">&copy; 2025 DocExtract. All rights reserved.</p>
        <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}
