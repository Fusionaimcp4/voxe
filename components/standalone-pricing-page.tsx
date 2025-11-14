"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Check, Star, ArrowRight, ChevronDown, MessageCircle, Ticket, BookOpen, Layout } from "lucide-react"
import { ContactModal } from "./contact-modal"
import { Header } from "./header"
import { FooterSection } from "./footer-section"
import Link from "next/link"
import Image from "next/image"

interface PricingPlan {
  name: string
  price: {
    monthly: number | string
    yearly: number | string
  }
  description: string
  features: string[]
  popular?: boolean
  ctaText: string
}

export function StandalonePricingPage() {
  const { data: session } = useSession()
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const plans: PricingPlan[] = [
    {
      name: "Starter",
      price: { monthly: 45, yearly: 499 },
      description: "For small teams who want 24/7 AI support without needing a full helpdesk team.",
      features: [
        "2 active chatbot",
        "Up to 12,000 chats / year",
        "Basic analytics",
      ],
      ctaText: "Start free trial",
    },
    {
      name: "Team",
      price: { monthly: 115, yearly: 1269 },
      description: "For growing companies that need AI + human collaboration with automatic routing.",
      features: [
        "5 active chatbots",
        "Up to 60,000 chats / year",
        "Team collaboration",
      ],
      popular: true,
      ctaText: "Start free trial",
    },
    {
      name: "Business",
      price: { monthly: 245, yearly: 2699 },
      description: "For high-volume teams needing advanced AI automation, analytics, and scaling.",
      features: [
        "10 active chatbots",
        "Up to 100,000 chats / year",
        "Advanced analytics",
      ],
      ctaText: "Start free trial",
    },
    {
      name: "Enterprise",
      price: { monthly: "Custom", yearly: "Custom" },
      description: "Tailored solutions for large organizations",
      features: [
        "Unlimited chatbots",
        "Unlimited chats",
        "Custom features",
      ],
      ctaText: "Talk to Sales",
    },
  ]

  // Calculate annual discount percentage
  const calculateDiscount = () => {
    const starterMonthly = 45 * 12 // $588
    const starterYearly = 499
    const discount = Math.round(((starterMonthly - starterYearly) / starterMonthly) * 100)
    return discount
  }

  const annualDiscount = calculateDiscount()

  const formatPrice = (price: number | string) => {
    if (typeof price === "string") return price
    return `$${price}`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      {/* Header Section */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Goal-oriented pricing that scales with you
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
              Choose the plan that fits your business. Switch or cancel anytime. Start with a free 14-day trial—no credit card required.
            </p>

            {/* Billing Toggle */}
            <div className="flex justify-center items-center gap-4 mb-12 relative">
              <span
                className={`text-base md:text-lg font-medium cursor-pointer transition-colors ${
                  billing === "monthly"
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 dark:text-slate-500"
                }`}
                onClick={() => setBilling("monthly")}
              >
                Billed monthly
              </span>
              <button
                onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  billing === "yearly" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                    billing === "yearly" ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span
                  className={`text-base md:text-lg font-medium cursor-pointer transition-colors ${
                    billing === "yearly"
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                  onClick={() => setBilling("yearly")}
                >
                  Billed yearly
                </span>
                {billing === "yearly" && (
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800">
                    Save {annualDiscount}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 md:p-8 flex flex-col ${
                  plan.popular
                    ? "border-emerald-500 shadow-xl shadow-emerald-500/20 scale-105"
                    : "border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                      {formatPrice(plan.price[billing])}
                    </span>
                    {typeof plan.price[billing] === "number" && (
                      <span className="text-slate-600 dark:text-slate-400 text-lg">
                        /mo
                      </span>
                    )}
                  </div>
                  {typeof plan.price[billing] === "number" && billing === "yearly" && (
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                      billed annually as ${typeof plan.price.yearly === "number" ? plan.price.yearly : ""}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {session ? (
                  <Link href="/dashboard" className="block">
                    <Button
                      className={`w-full py-3 md:py-4 rounded-xl font-semibold transition-all ${
                        plan.popular
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                      }`}
                    >
                      14 day free trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin" className="block">
                    <Button
                      className={`w-full py-3 md:py-4 rounded-xl font-semibold transition-all ${
                        plan.popular
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                      }`}
                    >
                      {plan.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Compare plans in detail
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              See exactly what you get in each plan. All features are designed to help you grow faster with AI automation.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden">
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">Features</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">Starter</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">Team</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">Business</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-900 dark:text-slate-100">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Active Chatbots */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Active chatbots</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">2</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">5</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">10</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">Unlimited</td>
                  </tr>
                  
                  {/* Chats Package */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Chats package</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">12,000 chats/yr</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">60,000 chats/yr</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">100,000 chats/yr</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">Unlimited</td>
                  </tr>
                  
                  {/* Training History */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Training history</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Team Collaboration */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Team collaboration</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Version History */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Version history</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* White Label */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">White label</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Section Header - Usage Limits */}
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={5} className="py-4 px-6 text-slate-900 dark:text-slate-100 font-bold">
                      Usage Limits
                    </td>
                  </tr>
                  
                  {/* Demos */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Demos</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">2</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">5</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">10</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">Unlimited</td>
                  </tr>
                  
                  {/* Knowledge Bases */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Knowledge Bases</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">2</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">5</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">50</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">Unlimited</td>
                  </tr>
                  
                  {/* Helpdesk Agents */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Helpdesk Agents</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">2 seat</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">5 seats</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">10 seats</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">Unlimited</td>
                  </tr>
                  
                  {/* Documents */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">Documents</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">10</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">50</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">1000</td>
                    <td className="text-center py-4 px-6 text-slate-900 dark:text-slate-100">Unlimited</td>
                  </tr>
                  
                  {/* Section Header - AI Features */}
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={5} className="py-4 px-6 text-slate-900 dark:text-slate-100 font-bold">
                      Artificial Intelligence
                    </td>
                  </tr>
                  
                  {/* Automatic bot building */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Automatic bot building</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Visual Builder */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Visual Builder</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* AI Knowledge */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">AI Knowledge</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* AI Assist */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">AI Assist</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* AI Model Training */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">AI model training</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Multilingual AI */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Multilingual AI</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Section Header - Integrations */}
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={5} className="py-4 px-6 text-slate-900 dark:text-slate-100 font-bold">
                      Integrations
                    </td>
                  </tr>
                  
                  {/* Chat Widget */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Chat Widget</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Slack, Zapier, etc */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Slack, Zapier, Webhooks</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Custom Integrations */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Custom Integrations</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Section Header - Support */}
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={5} className="py-4 px-6 text-slate-900 dark:text-slate-100 font-bold">
                      Product Support
                    </td>
                  </tr>
                  
                  {/* Email Support */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Email support</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Priority Support */}
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Priority Support</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                  
                  {/* Dedicated Account Manager */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">Dedicated Account Manager</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6">—</td>
                    <td className="text-center py-4 px-6 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5 mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Enterprise CTA */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-8 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="flex justify-center items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Looking for an Enterprise solution?
                  </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Get a plan suited to your company's needs
                </p>
                <ContactModal>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-medium">
                    Talk to Sales
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </ContactModal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-12 text-left">
            Frequently Asked Questions
          </h2>

          {/* Two Column FAQ Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {[
              {
                question: "How many chatbots can I create?",
                answer: "With Voxe, you can create as many chatbots as you need. Your pricing plan only limits how many can be active at the same time"
              },
              {
                question: "Can I use ChatBot on several websites?",
                answer:"Yes. You can install Voxe on multiple websites with any plan.You can use the same chatbot across sites or create different bots for each brand or domain, as long as they fit within your plan’s active chatbot limit."
              },
              {
                question: "What happens when I exceed my chats package?",
                answer: "If you go over your included chat quota, Voxe simply uses your credit balance to cover additional usage.You can add funds at any time, and we deduct the exact API cost of each request—no hidden fees, no inflated “per-chat” charges. Your Billing & Usage dashboard shows real-time token usage, cost per request, and total spend, so you always know exactly what you’re paying for.."
              },
              {
                question: "What payment forms do you accept?",
                answer: "We accept all major credit cards, including Visa, Mastercard, American Express, and Discover.Enterprise customers can request alternative payment options such as bank transfer or invoice-based billing."
              },
              {
                question: "What happens after my trial ends?",
                answer: "Your entire setup—chatbots, workflows, knowledge bases, and integrations—remains safe and intact.To keep using Voxe without interruption, just choose a plan and enter your payment details. Your account will continue exactly where you left off."
              },
              {
                question: "Can I respond to chats that my chatbot handles?",
                answer: "Yes. Voxe is built for seamless human + AI collaboration.\n\nWhen a customer needs a human, Voxe can:\n\nTransfer the chat to a human agent inside your Voxe Helpdesk\n\nAuto-assign the conversation to the correct team based on context\n\nAllow any agent to take over instantly at any time\n\nOnce a human takes over, the main AI steps back completely and will not interrupt.\n\nBehind the scenes, Voxe's secondary monitoring AI keeps an eye on every conversation.\n\nIf a message goes unanswered for too long, it will:\n\nRe-engage the customer with a polite assurance\n\nNotify your agent(s) in the background\n\nEscalate if needed\n\nThis hybrid system ensures customers always get a fast, accurate response—whether from AI or your team."
              },
              {
                "question": "Where do you store data?",
                "answer": "All Voxe data is hosted in secure, encrypted cloud infrastructure. Customer information, chat history, and knowledge bases are stored with industry-standard encryption and strict access controls. Your data never leaves our servers and is never shared with third parties."
              },
              {
                "question": "How many chatbots can I activate?",
                "answer": "You can create unlimited chatbots, but each plan defines how many can be active at the same time. An active chatbot is one that is live and connected to a website or channel integration."
              },
              {
                question: "What is a paid chat?",
                answer: "It's a chat that contains at least one successful interaction between the user and the chatbot. You'll never pay for spam chats."
              },
              {
                "question": "How can I get an invoice?",
                "answer": "After each successful payment, Voxe emails you a copy of your invoice. You can also view and download all past invoices directly from your Billing Dashboard at any time."
              },
              {
                "question": "Is there any contract required?",
                "answer": "No. Voxe is a simple month-to-month service with no long-term contracts or hidden fees. You can upgrade, downgrade, or cancel at any time."
              },
              {
                "question": "Do I need to provide my credit card details to register?",
                "answer": "No. You can start your free trial without entering any payment information. When you're ready to upgrade, you'll enter your credit card securely through Stripe, our payment processor."
              },
              {
                "question": "What languages does Voxe support?",
                "answer": "Voxe’s AI can understand and respond in virtually any language. Your chatbot automatically detects the customer’s language and replies accordingly. Inside the helpdesk, agents can also reply in any language with the help of built-in Google Translate integration, which translates incoming messages into the agent’s preferred language and converts replies back for the customer. For the best accuracy, we recommend enabling translation for multilingual support teams."
              },
              {
                "question": "Do you provide tips on how to create a chatbot?",
                "answer": "Yes. You can browse our Help Center and watch step-by-step video tutorials to learn everything from building your first chatbot to configuring advanced workflows. You can also ask our AI chat widget for technical guidance at any time—it can walk you through setup, detect where you are in the process, and help you complete each step."
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index
              
              return (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-6 flex items-center justify-between cursor-pointer"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-left pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-slate-600 dark:text-slate-400">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Discover Our Products Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Discover our <span className="font-bold">text|</span> products
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageCircle,
                iconColor: "bg-orange-100 dark:bg-orange-900/20",
                iconTextColor: "text-orange-500",
                name: "LiveChat",
                description: "Connect with customers"
              },
              {
                icon: Ticket,
                iconColor: "bg-emerald-100 dark:bg-emerald-900/20",
                iconTextColor: "text-emerald-500",
                name: "HelpDesk",
                description: "Support customers with tickets"
              },
              {
                icon: BookOpen,
                iconColor: "bg-purple-100 dark:bg-purple-900/20",
                iconTextColor: "text-purple-500",
                name: "KnowledgeBase",
                description: "Business information, AI training library"
              },
              {
                icon: Layout,
                iconColor: "bg-blue-100 dark:bg-blue-900/20",
                iconTextColor: "text-blue-500",
                name: "OpenWidget",
                description: "Enhance websites with widgets"
              },
            ].map((product, index) => {
              const Icon = product.icon
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-12 h-12 ${product.iconColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${product.iconTextColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {product.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Partner Up Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Partner up with Voxe
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Join as a Solution Partner and set up clients' accounts in no time directly in the Partner App.
              </p>
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-900 dark:border-slate-100 rounded-xl font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-100 dark:hover:text-slate-900 transition-colors"
              >
                Go to Partner Program
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Image with Overlay Cards */}
            <div className="relative">
              {/* Partner Team Image */}
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden">
                <Image
                  src="/images/Partner_Team_Image.png"
                  alt="Partner team working together"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Overlay Card 1 - Revenue */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-4 bg-blue-500 rounded-sm"></div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Revenue</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">+142%</p>
                  </div>
                </div>
              </div>

              {/* Overlay Card 2 - Licenses */}
              <div className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Voxe</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">21 licenses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Start Using Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Start using Voxe right away
              </h2>
            </div>

            {session ? (
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Welcome back! Continue to your dashboard.
                </p>
                <Link href="/dashboard">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 h-auto text-lg font-semibold shadow-lg">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <form className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input
                    type="email"
                    placeholder="Enter your business email"
                    className="flex-1 px-4 py-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Link href="/auth/signup">
                    <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 h-auto rounded-xl font-semibold text-lg shadow-lg">
                      Sign up free
                    </Button>
                  </Link>
                </form>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Free 14-days trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>No coding needed</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

     
      <FooterSection />
    </div>
  )
}
