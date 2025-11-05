import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Shield, FileText, ArrowRight } from "lucide-react"

export function HomeHero({ user }: { user: any }) {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-20 text-center md:py-32">
      <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl text-balance">Extract Document Data with AI</h1>
      <p className="mb-8 text-lg text-muted-foreground max-w-2xl text-balance">
        Powered by Azure Document Intelligence, extract structured data from your documents instantly and accurately.
      </p>
      <Link href={user ? "/dashboard" : "/auth/sign-up"}>
        <Button size="lg" className="gap-2">
          {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="h-5 w-5" />
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
    <div className="flex flex-col items-start gap-4 p-6 rounded-lg border bg-card">
      {icon}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
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
    <section className="px-6 py-20 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose DocExtract?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
  )
}

export function HomeFooter() {
  return (
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
  )
}
