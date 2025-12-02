"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { 
  Zap, Shield, FileText, ArrowRight, Sparkles, Upload, 
  Search, CheckCircle, Brain, Clock, Lock, BarChart3,
  FileSearch, Cpu, CloudUpload, MousePointer, Eye, ThumbsUp,
  Globe, Building2, BadgeCheck, TrendingUp, Layers, Target,
  Play, Star, Users, Award, Rocket, ChevronDown
} from "lucide-react"

// Custom hook for scroll-triggered animations
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(element) // Only trigger once
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px", ...options }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, isInView: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, isInView])

  return count
}

export function HomeHero({ user, loading }: { user: any; loading: boolean }) {
  const { ref: heroRef, isInView: heroInView } = useInView()
  const { ref: statsRef, isInView: statsInView } = useInView()
  
  const accuracyCount = useAnimatedCounter(99, 2000, statsInView)
  const docTypesCount = useAnimatedCounter(50, 2000, statsInView)
  
  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-44 lg:pb-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] animate-[pulse_4s_ease-in-out_infinite]" />
      
      {/* Floating gradient orbs with enhanced animation */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/15 dark:bg-violet-500/10 rounded-full blur-[120px] animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[100px] animate-[float_12s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[80px] animate-[float_9s_ease-in-out_infinite_reverse]" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            suppressHydrationWarning
            className="absolute w-2 h-2 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full animate-[float-particle_15s_ease-in-out_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      
      <div ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border border-indigo-200/60 dark:border-indigo-800/40 text-sm font-medium text-indigo-700 dark:text-indigo-300 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-default group">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Sparkles className="h-4 w-4 text-indigo-500 animate-[spin_3s_linear_infinite]" />
            Powered by Azure Document Intelligence
          </div>
          
          {/* Main heading with staggered animation */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className={`block text-slate-900 dark:text-white transition-all duration-700 delay-100 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Intelligent Document
            </span>
            <span className={`block bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-x_3s_ease-in-out_infinite] transition-all duration-700 delay-200 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Data Extraction
            </span>
          </h1>
          
          {/* Subtitle with fade in */}
          <p className={`text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 delay-300 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Transform any document into structured data in seconds. AI-powered extraction with human-in-the-loop validation for enterprise accuracy.
          </p>
          
          {/* CTA buttons with hover effects */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-700 delay-400 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <Link href={user ? "/dashboard" : "/auth/sign-up"}>
              <Button 
                size="lg" 
                className="group h-14 px-8 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : user ? "Go to Dashboard" : "Start Free Trial"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button 
                variant="outline" 
                size="lg" 
                className="group h-14 px-8 text-base font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl hover:scale-[1.02] transition-all duration-300"
              >
                <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                See How It Works
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators with staggered reveal */}
          <div className={`flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 mb-16 transition-all duration-700 delay-500 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="flex items-center gap-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors group cursor-default">
              <BadgeCheck className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors group cursor-default">
              <Shield className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span>Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors group cursor-default">
              <Zap className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Results in seconds</span>
            </div>
          </div>
          
          {/* Animated Stats */}
          <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className={`group p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 ${statsInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`} style={{ animationDelay: '0ms' }}>
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{accuracyCount}%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Accuracy Rate</div>
            </div>
            <div className={`group p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 ${statsInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">&lt;3s</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Processing Time</div>
            </div>
            <div className={`group p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 ${statsInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{docTypesCount}+</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Document Types</div>
            </div>
            <div className={`group p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1 ${statsInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Availability</div>
            </div>
          </div>
        </div>
        
        {/* Hero image/mockup with enhanced animations */}
        <div className={`mt-16 relative transition-all duration-1000 delay-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent dark:from-slate-950 z-10 pointer-events-none h-32" />
          <div className="relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden hover:shadow-3xl hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30 transition-all duration-500 group">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                  <Lock className="h-3 w-3 text-emerald-500" />
                  docextract.app/documents
                </div>
              </div>
            </div>
            {/* App preview */}
            <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: PDF preview with shimmer effect */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-4 h-64 sm:h-80 flex flex-col group-hover:border-indigo-300 dark:group-hover:border-indigo-800 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Invoice_2024.pdf</span>
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Processing...</span>
                  </div>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <div className="text-center">
                      <FileSearch className="h-12 w-12 text-slate-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Analyzing document...</p>
                    </div>
                  </div>
                </div>
                {/* Right: Extracted fields with staggered animation */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-4 group-hover:border-emerald-300 dark:group-hover:border-emerald-800 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Extracted Fields</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      98% confidence
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Invoice Number", value: "INV-2024-0847", confidence: 99 },
                      { label: "Total Amount", value: "$2,450.00", confidence: 98 },
                      { label: "Due Date", value: "Dec 15, 2024", confidence: 97 },
                      { label: "Vendor Name", value: "Acme Corporation", confidence: 96 },
                    ].map((field, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{field.label}</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{field.value}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" 
                              style={{ width: `${field.confidence}%` }} 
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{field.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className={`flex justify-center mt-12 transition-all duration-1000 delay-1000 ${heroInView ? 'opacity-100' : 'opacity-0'}`}>
          <a href="#trusted-by" className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors group cursor-pointer">
            <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  )
}

export function HomeTrustedBy() {
  const { ref, isInView } = useInView()
  
  const industries = [
    { name: "Finance", icon: TrendingUp },
    { name: "Healthcare", icon: Shield },
    { name: "Legal", icon: FileText },
    { name: "Logistics", icon: Globe },
    { name: "Real Estate", icon: Building2 },
    { name: "Insurance", icon: BadgeCheck },
  ]

  return (
    <section id="trusted-by" className="py-16 border-y border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 overflow-hidden">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className={`text-center text-sm font-semibold text-slate-500 dark:text-slate-400 mb-10 uppercase tracking-wider transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Trusted across industries
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {industries.map((industry, idx) => {
            const IconComponent = industry.icon
            return (
              <div 
                key={industry.name} 
                className={`group flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-600/40 hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 cursor-default ${isInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 group-hover:from-indigo-200 group-hover:to-violet-200 dark:group-hover:from-indigo-500/30 dark:group-hover:to-violet-500/30 transition-colors group-hover:scale-110 duration-300">
                  <IconComponent className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{industry.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HomeUseCases() {
  const { ref, isInView } = useInView()
  
  const useCases = [
    {
      title: "Invoice Processing",
      description: "Extract invoice numbers, amounts, due dates, and vendor details automatically. Perfect for accounts payable automation.",
      icon: FileText,
      color: "emerald",
      stats: "80% faster processing"
    },
    {
      title: "Receipt Scanning",
      description: "Capture expense data from receipts instantly. Extract merchant names, totals, taxes, and payment methods.",
      icon: BarChart3,
      color: "blue",
      stats: "99% accuracy rate"
    },
    {
      title: "Contract Analysis",
      description: "Pull key terms, dates, parties, and clauses from legal documents. Speed up contract review workflows.",
      icon: Layers,
      color: "violet",
      stats: "5x faster review"
    },
    {
      title: "ID Verification",
      description: "Extract data from IDs, passports, and licenses for KYC compliance and identity verification processes.",
      icon: BadgeCheck,
      color: "amber",
      stats: "Enterprise-ready"
    },
  ]

  const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string; shadow: string }> = {
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-800/40", hover: "hover:border-emerald-300 dark:hover:border-emerald-700", shadow: "hover:shadow-emerald-500/10" },
    blue: { bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200/60 dark:border-blue-800/40", hover: "hover:border-blue-300 dark:hover:border-blue-700", shadow: "hover:shadow-blue-500/10" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/50", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200/60 dark:border-violet-800/40", hover: "hover:border-violet-300 dark:hover:border-violet-700", shadow: "hover:shadow-violet-500/10" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200/60 dark:border-amber-800/40", hover: "hover:border-amber-300 dark:hover:border-amber-700", shadow: "hover:shadow-amber-500/10" },
  }

  return (
    <section className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 dark:bg-violet-500/5 rounded-full blur-[80px]" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Target className="h-3 w-3" />
            Use Cases
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Built for your
            <span className="block text-emerald-600 dark:text-emerald-400">document workflows</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            From invoices to contracts, extract data from any document type with industry-leading accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => {
            const colors = colorClasses[useCase.color]
            const IconComponent = useCase.icon
            return (
              <div 
                key={idx} 
                className={`group relative p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 ${colors.hover} transition-all duration-500 hover:shadow-xl ${colors.shadow} hover:-translate-y-2 cursor-default ${isInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-transparent to-slate-100/50 dark:to-slate-800/50 pointer-events-none" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl ${colors.bg} ${colors.text} ${colors.border} border group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-7 w-7" />
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      {useCase.stats}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {useCase.description}
                  </p>
                  
                  {/* Learn more link */}
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Learn more</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HomeFeatures() {
  const { ref, isInView } = useInView()
  
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Extraction",
      description: "Azure Document Intelligence analyzes your documents and extracts data with high accuracy, understanding context and structure.",
      color: "indigo"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Process documents in seconds, not hours. Our optimized pipeline delivers results faster than any manual process.",
      color: "amber"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Visual Validation",
      description: "See exactly where each field was extracted from with highlighted bounding boxes. Click to navigate in the PDF.",
      color: "emerald"
    },
    {
      icon: <ThumbsUp className="h-6 w-6" />,
      title: "Human-in-the-Loop",
      description: "Validate extractions with thumbs up/down feedback. Choose from alternative values ranked by confidence.",
      color: "violet"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "Row-level security ensures your data is isolated. Encrypted storage and secure authentication protect everything.",
      color: "rose"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Confidence Scores",
      description: "Every extracted field comes with a confidence score so you know exactly how reliable the extraction is.",
      color: "cyan"
    },
  ]

  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/50", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200/60 dark:border-indigo-800/40", glow: "group-hover:shadow-indigo-500/20" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200/60 dark:border-amber-800/40", glow: "group-hover:shadow-amber-500/20" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-800/40", glow: "group-hover:shadow-emerald-500/20" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/50", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200/60 dark:border-violet-800/40", glow: "group-hover:shadow-violet-500/20" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/50", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200/60 dark:border-rose-800/40", glow: "group-hover:shadow-rose-500/20" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-950/50", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200/60 dark:border-cyan-800/40", glow: "group-hover:shadow-cyan-500/20" },
  }

  return (
    <section id="features" className="py-24 sm:py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/5 dark:bg-violet-500/5 rounded-full blur-[100px]" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Everything you need to
            <span className="block text-indigo-600 dark:text-indigo-400">extract document data</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A complete solution for document processing with AI extraction, human validation, and seamless export.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const colors = colorClasses[feature.color]
            return (
              <div 
                key={idx} 
                className={`group relative p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-500 hover:shadow-xl ${colors.glow} hover:-translate-y-2 cursor-default ${isInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Animated corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100/80 to-transparent dark:from-slate-800/50 rounded-tr-2xl rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${colors.bg} ${colors.text} ${colors.border} border mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HomeHowItWorks() {
  const { ref, isInView } = useInView()
  const [activeStep, setActiveStep] = useState(0)
  
  const steps = [
    {
      step: "01",
      icon: <CloudUpload className="h-6 w-6" />,
      title: "Upload Document",
      description: "Drag and drop your PDF or image. We support invoices, receipts, contracts, and more.",
    },
    {
      step: "02",
      icon: <Cpu className="h-6 w-6" />,
      title: "Define Fields",
      description: "Specify which fields to extract—text, numbers, dates, currency. AI understands context.",
    },
    {
      step: "03",
      icon: <Search className="h-6 w-6" />,
      title: "AI Extraction",
      description: "Azure Document Intelligence processes your document and extracts all defined fields.",
    },
    {
      step: "04",
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Validate & Export",
      description: "Review extractions, validate with one click, and export as CSV or JSON.",
    },
  ]

  // Auto-advance steps
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isInView, steps.length])

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-violet-500/5 dark:bg-violet-500/5 rounded-full blur-[120px] -translate-x-1/2" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200/60 dark:border-violet-800/40 text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            <Rocket className="h-3 w-3" />
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Four simple steps to
            <span className="block text-violet-600 dark:text-violet-400">structured data</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            From document upload to validated data export in minutes, not hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, idx) => (
            <div 
              key={idx} 
              className={`relative ${isInView ? 'animate-[fade-in-up_0.6s_ease-out_forwards]' : 'opacity-0'}`}
              style={{ animationDelay: `${idx * 150}ms` }}
              onMouseEnter={() => setActiveStep(idx)}
            >
              {/* Connector line with animation */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 transition-all duration-500 ${activeStep > idx ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : ''}`} />
                  <div 
                    className={`absolute top-0 h-full w-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-transform duration-500 ${activeStep > idx ? 'translate-x-0' : '-translate-x-full'}`}
                  />
                </div>
              )}
              
              <div 
                className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 text-center transition-all duration-500 cursor-pointer ${
                  activeStep === idx 
                    ? 'border-indigo-500 dark:border-indigo-400 shadow-xl shadow-indigo-500/20 scale-[1.02]' 
                    : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50'
                }`}
              >
                {/* Pulse animation for active step */}
                {activeStep === idx && (
                  <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 animate-pulse" />
                )}
                
                <div className={`relative inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br transition-all duration-500 ${
                  activeStep === idx 
                    ? 'from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30' 
                    : 'from-indigo-500/80 to-violet-500/80'
                } text-white mb-4`}>
                  {item.icon}
                </div>
                <div className={`absolute -top-3 left-6 px-2 py-0.5 text-xs font-bold rounded-md transition-colors duration-300 ${
                  activeStep === idx 
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white' 
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                }`}>
                  {item.step}
                </div>
                <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                  activeStep === idx 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mt-8 lg:hidden">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeStep === idx 
                  ? 'w-8 bg-indigo-500' 
                  : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeCallToAction({ user }: { user: any }) {
  const { ref, isInView } = useInView()
  
  return (
    <section className="py-24 sm:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px] animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/30 rounded-full blur-[100px] animate-[float_10s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                suppressHydrationWarning
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-[float-particle_15s_ease-in-out_infinite]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${8 + Math.random() * 8}s`,
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 text-center">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-default">
              <Rocket className="h-4 w-4 text-indigo-400 animate-bounce" />
              Ready to get started?
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to automate your
              <span className="block text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text animate-[gradient-x_3s_ease-in-out_infinite] bg-[length:200%_auto]">document processing?</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
              Join teams who have transformed their workflow with AI-powered document extraction. Start your free trial today—no credit card required.
            </p>
            
            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              <div className="flex items-center gap-2 text-white/80">
                <Users className="h-5 w-5 text-indigo-400" />
                <span>500+ Teams</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FileText className="h-5 w-5 text-violet-400" />
                <span>1M+ Documents</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Star className="h-5 w-5 text-amber-400" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? "/extract" : "/auth/sign-up"}>
                <Button size="lg" className="group h-14 px-8 text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.98]">
                  {user ? "Extract Documents" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/privacy">
                <Button variant="outline" size="lg" className="group h-14 px-8 text-base font-medium border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl transition-all duration-300">
                  <Shield className="mr-2 h-4 w-4" />
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeFooter() {
  const { ref, isInView } = useInView()
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="group flex items-center gap-2.5 mb-4 w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:scale-105">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">DocExtract</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mb-6">
              AI-powered document extraction platform. Upload, extract, validate, and export structured data from any document.
            </p>
            
            {/* Social links placeholder */}
            <div className="flex gap-3">
              {[Globe, Building2, Award].map((Icon, idx) => (
                <button
                  key={idx}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all duration-300 cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {[
                { href: "#features", label: "Features" },
                { href: "#how-it-works", label: "How it Works" },
                { href: "/auth/sign-up", label: "Get Started" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="group text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className={`pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-700 delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            © {currentYear} DocExtract. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-1">
            Built with <span className="text-red-500 animate-pulse">❤️</span> by{" "}
            <a 
              href="https://github.com/sriramkolli-zennith" 
              className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zennith AI
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
