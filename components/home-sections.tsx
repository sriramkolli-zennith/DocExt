import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Shield, FileText, ArrowRight, Sparkles } from "lucide-react"

export function HomeHero({ user, loading }: { user: any; loading: boolean }) {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 dark:bg-violet-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Powered by Azure Document Intelligence
        </div>
        <h1 className="mb-6 text-4xl sm:text-5xl lg:text-7xl font-bold text-balance leading-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 dark:from-white dark:via-indigo-200 dark:to-violet-200 bg-clip-text text-transparent">
          Extract Document Data<br />with AI Precision
        </h1>
        <p className="mb-8 sm:mb-10 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-balance">
          Transform your documents into structured data instantly. Upload, extract, and validate with confidence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={user ? "/dashboard" : "/auth/sign-up"}>
            <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/30 font-semibold rounded-xl px-8 py-6 text-base" disabled={loading}>
              {loading ? "Loading..." : user ? "Go to Dashboard" : "Get Started Free"} 
              {!loading && <ArrowRight className="h-5 w-5" />}
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-8 py-6 text-base font-medium">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

interface FeatureProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

export function FeatureCard({ icon, title, description, gradient }: FeatureProps) {
  return (
    <div className="group flex flex-col items-start gap-4 p-6 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 transition-all duration-300 hover:-translate-y-1">
      <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

export function HomeFeatures() {
  const features = [
    {
      icon: <Zap className="h-6 w-6 text-white" />,
      title: "Lightning Fast",
      description: "Extract data from documents in seconds using AI-powered recognition. No manual data entry required.",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely. Enterprise-grade security with row-level access control.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: <FileText className="h-6 w-6 text-white" />,
      title: "Smart Extraction",
      description: "Extract custom fields with AI confidence scores. Validate and correct with alternative suggestions.",
      gradient: "from-indigo-500 to-violet-500",
    },
  ]

  return (
    <section id="features" className="px-4 sm:px-6 lg:px-12 py-20 sm:py-28 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            Why Choose DocExtract?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Built for teams who need reliable, fast document processing with human-in-the-loop validation.
          </p>
        </div>
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
    <section className="relative px-4 sm:px-6 lg:px-12 py-20 sm:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
          Ready to Transform Your Workflow?
        </h2>
        <p className="mb-8 sm:mb-10 text-lg sm:text-xl text-indigo-100 max-w-xl mx-auto">
          Join thousands of teams extracting document data with AI precision. Start your free trial today.
        </p>
        <Link href="/auth/sign-up">
          <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 shadow-lg shadow-indigo-900/30 font-semibold rounded-xl px-8 py-6 text-base">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

export function HomeFooter() {
  return (
    <footer className="px-4 sm:px-6 lg:px-12 py-8 border-t border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
            <FileText className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">DocExtract</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-500">&copy; 2025 DocExtract. All rights reserved.</p>
        <div className="flex gap-6 text-sm">
          <Link href="/privacy" className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
            Privacy
          </Link>
          <Link href="/terms" className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
