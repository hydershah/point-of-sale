"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Coffee,
  FolderCog,
  Globe,
  Layers,
  MessageSquareQuote,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Utensils,
  Zap,
  TrendingUp,
  Award,
  Menu,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = "smooth"

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.documentElement.style.scrollBehavior = "auto"
    }
  }, [])
  const stats = [
    { label: "Transactions processed annually", value: "$2.5B+" },
    { label: "Multi-location brands onboarded", value: "12,500+" },
    { label: "Enterprise uptime commitment", value: "99.995% SLA" },
  ]

  const featureHighlights = [
    {
      title: "Unified Commerce Engine",
      description:
        "Connect every channel, catalog, and fulfillment workflow inside a single enterprise-grade control plane.",
      icon: Layers,
      bullets: [
        "Real-time inventory across stores, ecommerce, and marketplaces",
        "Dynamic pricing, promotions, and product bundles at scale",
        "Advanced order routing with curbside, pickup, and delivery orchestration",
      ],
    },
    {
      title: "Executive Analytics",
      description:
        "Give leaders and operators the clarity they need with live dashboards and predictive reporting.",
      icon: BarChart3,
      bullets: [
        "AI-powered demand forecasting and workforce optimization",
        "Role-based dashboards tailored for finance, ops, and marketing",
        "Automated scheduled reports with configurable alerts",
      ],
    },
    {
      title: "People & Operations",
      description:
        "Empower frontline teams with an intuitive POS while headquarters orchestrates policy, menus, and compliance.",
      icon: Users,
      bullets: [
        "Granular role-based access with SSO (Okta, Azure AD, Google)",
        "Manager workflows for transfers, approvals, and audit logging",
        "Guided training, shift handoffs, and mobile management tools",
      ],
    },
  ]

  const industrySolutions = [
    {
      title: "Multi-site Retail",
      description:
        "Omnichannel retail perfected with unified inventory, endless aisle, and seamless returns across every location.",
      icon: Store,
      points: [
        "Enterprise catalog + barcode automation",
        "Clienteling and CRM with personalized promotions",
        "Automated replenishment and vendor scorecards",
      ],
    },
    {
      title: "Restaurants & Hospitality",
      description:
        "Optimize front-of-house and back-of-house operations with real-time kitchen orchestration and guest insights.",
      icon: Utensils,
      points: [
        "Menu engineering with modifiers and dayparts",
        "Kitchen display, expo, and delivery provider integrations",
        "Guest engagement and loyalty journeys built-in",
      ],
    },
    {
      title: "Coffee & QSR Brands",
      description:
        "Speed and consistency for high-volume counter service with mobile ordering and drive-thru readiness.",
      icon: Coffee,
      points: [
        "Line-busting mobile POS and offline resilience",
        "Membership programs, stored value, and gifting",
        "Drive-thru timers and production pacing intelligence",
      ],
    },
    {
      title: "Direct-to-Consumer & Pop-ups",
      description:
        "Launch new concepts in days with flexible deployments, hardware kits, and centralized governance.",
      icon: ShoppingBag,
      points: [
        "Rapid roll-outs with remote provisioning",
        "Temporary venue support with IoT-ready hardware",
        "Compliance guardrails for franchise and seasonal teams",
      ],
    },
  ]

  const platformPillars = [
    {
      title: "Cloud-native resilience",
      description:
        "Global, multi-region infrastructure with active-active failover, real-time backups, and offline-capable POS endpoints.",
      icon: Cloud,
    },
    {
      title: "Security & compliance",
      description:
        "SOC 2 Type II, PCI DSS Level 1, GDPR-ready data residency, and continuous penetration testing.",
      icon: ShieldCheck,
    },
    {
      title: "Extensible architecture",
      description:
        "GraphQL and REST APIs, webhooks, and SDKs so your internal teams and partners can build without friction.",
      icon: FolderCog,
    },
    {
      title: "Global scale",
      description:
        "Localized workflows for tax, currency, and languages with centralized governance across every region.",
      icon: Globe,
    },
  ]

  const securityChecklist = [
    "Hardware-agnostic deployment with remote device management",
    "Fine-grained permissions, audit trails, and policy enforcement",
    "Optional dedicated private cloud and data residency controls",
    "Quarterly disaster recovery exercises with transparent reporting",
  ]

  const testimonials = [
    {
      quote:
        "We unified 480 locations in under six months. The rollout playbooks, analytics, and governance controls are best-in-class, and their team shipped platform integrations twice as fast as our previous vendor.",
      name: "Elena Ramos",
      title: "Chief Operating Officer",
      company: "Northshore Markets",
    },
    {
      quote:
        "The executive dashboards finally connect finance, operations, and supply chain. We forecast, schedule, and act on the same data, which dropped labor variance by 18% in the first quarter.",
      name: "Rahul Patel",
      title: "VP of Digital Transformation",
      company: "Velocity Hospitality Group",
    },
  ]

  const pricingTiers = [
    {
      name: "Growth",
      price: "From $299/mo",
      description: "Built for emerging brands scaling to 10 locations.",
      features: [
        "Unified catalog, inventory, and promotions",
        "Advanced analytics with 24-hour data refresh",
        "Standard support with rollout playbooks",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored programs for global, multi-banner operations.",
      features: [
        "Dedicated success team and 24/7 white-glove support",
        "SSO, multi-brand governance, and compliance suites",
        "Custom integrations and sandbox environments",
      ],
      highlight: true,
    },
    {
      name: "Franchise",
      price: "From $549/mo",
      description: "Perfect for franchise groups needing centralized controls with owner flexibility.",
      features: [
        "Royalty reporting and franchise performance dashboards",
        "Co-op marketing and localized menus",
        "Shared services billing and procurement",
      ],
    },
  ]

  const integrations = [
    "Stripe",
    "Adyen",
    "QuickBooks",
    "NetSuite",
    "HubSpot",
    "Xero",
    "Salesforce",
    "Zapier",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">
      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl"
            : "border-slate-200/50 bg-white/80 backdrop-blur"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-semibold text-primary transition-transform hover:scale-105">
            POS Platform
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link href="#features" className="transition-colors hover:text-slate-900">
              Platform
            </Link>
            <Link href="#industries" className="transition-colors hover:text-slate-900">
              Industries
            </Link>
            <Link href="#security" className="transition-colors hover:text-slate-900">
              Security
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-slate-900">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-block">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/contact" className="hidden md:inline-block">
              <Button size="sm" className="gap-2">
                Talk to Sales
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="container mx-auto space-y-1 px-4 py-4">
              <Link
                href="#features"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Platform
              </Link>
              <Link
                href="#industries"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Industries
              </Link>
              <Link
                href="#security"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Security
              </Link>
              <Link
                href="#pricing"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link href="/login" className="block pt-2">
                <Button variant="ghost" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/contact" className="block">
                <Button size="sm" className="w-full gap-2">
                  Talk to Sales
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4">
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]" />
          <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              New for 2025: AI-Powered Multi-Tenant POS Cloud
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
              Enterprise POS reimagined for{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                modern brands
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl">
              Launch, oversee, and scale every concept from one secure platform. We bring together commerce, teams,
              and insights so your operators can act in the moment and your leadership can plan with precision.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/contact">
                <Button size="lg" className="group gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                  Request a Demo
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
              <Link
                href="#features"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3 hover:text-primary/80"
              >
                Explore the platform
                <TrendingUp className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-20 grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="group border border-slate-200/70 bg-white/70 shadow-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                >
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-3xl font-semibold text-slate-900 transition-colors group-hover:text-primary">
                      {stat.value}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      {stat.label}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-5xl text-center">
            <Badge variant="outline" className="mb-4">
              <Award className="mr-2 h-3 w-3" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              All the power you need in one connected platform
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Replace siloed systems with a unified suite that aligns headquarters and front-line teams, scales with
              demand, and integrates with the tools you already trust.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {featureHighlights.map((feature, index) => (
              <Card
                key={feature.title}
                className="group h-full border border-slate-200/70 shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-col gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-lg group-hover:shadow-primary/20">
                    <feature.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-xl transition-colors group-hover:text-primary">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {feature.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="industries" className="py-20">
          <div className="mb-12 flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4">
              Built for every concept
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl md:text-5xl">
              Purpose-built solutions for your vertical
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              Configure once, deploy everywhere. Whether you are operating retail flagships, scaling quick-service
              concepts, or testing pop-up pilots, the platform adapts to your workflows.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {industrySolutions.map((industry, index) => (
              <Card
                key={industry.title}
                className="group border border-slate-200/70 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="mt-1 inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-lg group-hover:shadow-primary/20">
                    <industry.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                  </div>
                  <div>
                    <CardTitle className="text-xl transition-colors group-hover:text-primary">{industry.title}</CardTitle>
                    <CardDescription className="mt-2 text-slate-600">
                      {industry.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  {industry.points.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:scale-110" />
                      <span>{point}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="platform" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 text-slate-100 shadow-2xl md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.2),_transparent_60%)]" />
          <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 bottom-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-5xl">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4 border-white/20 bg-white/10 text-white">
                <Zap className="mr-2 h-3 w-3" />
                Enterprise-Grade Infrastructure
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
                Engineered for reliability, security, and global scale
              </h2>
              <p className="mt-6 text-lg text-slate-300">
                Modern infrastructure, proactive compliance, and open APIs keep your brand moving faster than the
                market.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {platformPillars.map((pillar, index) => (
                <Card
                  key={pillar.title}
                  className="group border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-primary/20"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:from-primary/40 group-hover:to-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30">
                      <pillar.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-100 transition-colors group-hover:text-white">
                        {pillar.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-slate-300 group-hover:text-slate-200">
                        {pillar.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Badge variant="outline" className="mb-4">
                <ShieldCheck className="mr-2 h-3 w-3" />
                Security & Compliance
              </Badge>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl md:text-5xl">
                Enterprise security with transparency built in
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Security is foundational to every feature we ship. Compliance, governance, and observability come
                standard so you can deploy with confidence.
              </p>
              <div className="mt-8 space-y-4">
                {securityChecklist.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-600 transition-all hover:translate-x-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 transition-all hover:scale-105 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md">
                  SOC 2 Type II
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 transition-all hover:scale-105 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md">
                  PCI DSS Level 1
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 transition-all hover:scale-105 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md">
                  GDPR & CCPA Ready
                </span>
              </div>
            </div>
            <Card className="group border border-slate-200/70 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10">
                  <BarChart3 className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <CardTitle className="text-xl transition-colors group-hover:text-primary">
                  Operations Control Tower
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Live observability and governance for distributed teams.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:scale-110" />
                  <div>
                    <p className="font-medium text-slate-800">Real-time monitoring</p>
                    <p>Command center dashboards with proactive alerts and automated incident playbooks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:scale-110" />
                  <div>
                    <p className="font-medium text-slate-800">Comprehensive audit trails</p>
                    <p>Immutable event logs with exports for compliance, finance, and franchise partners.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:scale-110" />
                  <div>
                    <p className="font-medium text-slate-800">Automated governance</p>
                    <p>Policy enforcement with version control, approval workflows, and rollback support.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-4">
                  <Award className="mr-2 h-3 w-3" />
                  Trusted Integrations
                </Badge>
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl md:text-5xl">
                  Trusted by operators everywhere
                </h2>
              </div>
              <p className="text-lg text-slate-600">
                Enterprise teams rely on our partnership program for end-to-end enablement: onboarding, rollout, change
                management, and value realization.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                {integrations.map((integration, index) => (
                  <span
                    key={integration}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 transition-all hover:scale-105 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {integration}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.name}
                  className="group border border-slate-200/70 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10">
                      <MessageSquareQuote className="h-6 w-6 transition-transform group-hover:scale-110" />
                    </div>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      &ldquo;{testimonial.quote}&rdquo;
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-slate-500">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              Flexible commercial models
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl md:text-5xl">
              Pricing aligned to your growth plan
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From emerging concepts to global enterprise, choose the program that matches your footprint and roadmap.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <Card
                key={tier.name}
                className={`group flex h-full flex-col border transition-all duration-300 hover:scale-105 ${
                  tier.highlight
                    ? "border-primary/50 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30"
                    : "border-slate-200/70 shadow-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-indigo-600 shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="relative">
                  <CardTitle className="text-2xl transition-colors group-hover:text-primary">{tier.name}</CardTitle>
                  <p className="text-3xl font-bold text-slate-900">{tier.price}</p>
                  <CardDescription className="text-slate-600">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 text-sm text-slate-600">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-transform group-hover:scale-110" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
                <div className="px-6 pb-6 pt-4">
                  <Link href="/contact">
                    <Button
                      className={`group/btn w-full gap-2 ${
                        tier.highlight ? "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" : ""
                      }`}
                      variant={tier.highlight ? "default" : "outline"}
                    >
                      Talk to Sales
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-500 to-violet-500 py-20 text-white shadow-2xl md:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_50%)]" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">Ready to modernize every location?</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/90 md:text-xl">
              Partner with the team that has deployed high-performing commerce experiences for the world&apos;s fastest
              growing retail and hospitality brands.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/contact">
                <Button size="lg" className="group gap-2 bg-white text-primary shadow-xl transition-all hover:scale-105 hover:bg-white/95 hover:shadow-2xl">
                  Schedule a discovery call
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-all hover:gap-3 hover:text-white"
              >
                Download enterprise overview
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-24 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <Link href="/" className="text-xl font-semibold text-primary transition-transform hover:scale-105">
                POS Platform
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Enterprise-grade POS and commerce infrastructure for retail, hospitality, and emerging concepts across
                the globe.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Platform</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <Link href="#features" className="block transition-colors hover:text-primary">
                  Product Overview
                </Link>
                <Link href="#platform" className="block transition-colors hover:text-primary">
                  Architecture
                </Link>
                <Link href="#security" className="block transition-colors hover:text-primary">
                  Security & Compliance
                </Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Resources</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <Link href="/contact" className="block transition-colors hover:text-primary">
                  Customer Stories
                </Link>
                <Link href="/contact" className="block transition-colors hover:text-primary">
                  Implementation Services
                </Link>
                <Link href="/contact" className="block transition-colors hover:text-primary">
                  Partner Ecosystem
                </Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Connect</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <Link href="/contact" className="block transition-colors hover:text-primary">
                  Talk to Sales
                </Link>
                <Link href="/contact" className="block transition-colors hover:text-primary">
                  Request a Demo
                </Link>
                <Link href="/login" className="block transition-colors hover:text-primary">
                  Customer Login
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex md:items-center md:justify-between">
            <p>&copy; {new Date().getFullYear()} Multi-Tenant POS Platform. All rights reserved.</p>
            <div className="mt-4 flex gap-6 md:mt-0">
              <Link href="/contact" className="transition-colors hover:text-primary">
                Privacy
              </Link>
              <Link href="/contact" className="transition-colors hover:text-primary">
                Terms
              </Link>
              <Link href="/contact" className="transition-colors hover:text-primary">
                Status
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
