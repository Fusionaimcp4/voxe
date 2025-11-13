"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, TrendingDown, Users, MessageSquare, Check, Star } from "lucide-react"
import { ContactModal } from "./contact-modal"
import { HelpPromoBanner } from "./help/HelpPromoBanner"

interface PricingPlan {
  id: string
  tier: string
  name: string
  price: number
  currency: string
  period: string
  description: string
  features: string[]
  isPopular: boolean
  ctaText: string
  ctaHref: string
}

export function PricingCalculator() {
  const [agents, setAgents] = useState(5)
  const [conversations, setConversations] = useState(1000)
  const [currentProvider, setCurrentProvider] = useState("intercom")
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // EthioTelecom pricing comparison block (static data in ETB)
  const ethioTelecomPricing = {
    monthlyFee: 2078.65, // ETB per agent per month
    setupFees: {
      multiChannelAgentBundle: 535764.94,
      addOnModule: 247859.04,
      ivrOnboarding: 366918.45,
      smsOnboarding: 309261.68,
      chatbotSetup: 2118438.92,
      additionalChatbotChannel: 710842.60
    }
  }

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        const response = await fetch('/api/pricing')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to fetch pricing plans:', response.status, errorData)
          setPricingPlans([])
          setLoading(false)
          return
        }
        
        const plans = await response.json()
        
        // Validate that plans is an array
        if (!Array.isArray(plans)) {
          console.error('Invalid pricing plans response format:', plans)
          setPricingPlans([])
          setLoading(false)
          return
        }
        
        // Filter out any plans that don't have required fields
        const validPlans = plans.filter((p: any) => p.id && p.tier && p.name && p.price !== undefined)
        
        if (validPlans.length === 0) {
          console.warn('No valid pricing plans found')
          setPricingPlans([])
          setLoading(false)
          return
        }
        
        setPricingPlans(validPlans)
        
        // Set default to PRO plan if available, or first non-free plan
        const proPlan = validPlans.find((p: PricingPlan) => p.tier === 'PRO')
        const defaultPlan = proPlan || validPlans.find((p: PricingPlan) => p.tier !== 'FREE')
        if (defaultPlan) {
          setSelectedPlan(defaultPlan.id)
        }
      } catch (error) {
        console.error('Failed to fetch pricing plans:', error)
        setPricingPlans([])
      } finally {
        setLoading(false)
      }
    }
    fetchPricingPlans()
  }, [])

  const formatETB = (amount: number) => {
    return new Intl.NumberFormat('en-ET', { 
      style: 'currency', 
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const totalSetupCost = Object.values(ethioTelecomPricing.setupFees).reduce((sum, cost) => sum + cost, 0)

  const calculateSavings = () => {
    let currentCost = 0
    let VoxeCost = 0

    // Current provider costs (monthly)
    switch (currentProvider) {
      case "intercom":
        currentCost = agents * 50 + conversations * 0.5 // $50/agent + $0.50/conversation
        break
      case "zendesk":
        currentCost = agents * 45 + conversations * 0.3 // $45/agent + $0.30/conversation
        break
      case "freshdesk":
        currentCost = agents * 35 + conversations * 0.2 // $35/agent + $0.20/conversation
        break
      default:
        currentCost = agents * 40 + conversations * 0.4
    }

    // Voxe cost from selected pricing plan
    if (selectedPlan) {
      const plan = pricingPlans.find(p => p.id === selectedPlan)
      if (plan) {
        VoxeCost = plan.price
      } else {
        VoxeCost = 29 // Default fallback
      }
    } else {
      VoxeCost = 29 // Default fallback
    }

    const savings = currentCost - VoxeCost
    const savingsPercentage = currentCost > 0 ? ((savings / currentCost) * 100).toFixed(0) : '0'

    return {
      currentCost: Math.round(currentCost),
      VoxeCost: Math.round(VoxeCost),
      savings: Math.round(savings),
      savingsPercentage
    }
  }

  const results = calculateSavings()

  return (
    <section className="w-full px-5 py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
      {/* Very subtle light background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-950 dark:to-slate-900" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 mb-6">
            <Calculator className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Savings Calculator</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Calculate Your Savings
          </h2>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            See how much you could save by switching from per-agent or per-resolution providers. 
            Most businesses save 60-80% on support costs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Input */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-400 dark:text-slate-400">
                <Calculator className="w-5 h-5" />
                Your Current Setup
              </CardTitle>
              <CardDescription className="text-slate-400 dark:text-slate-400">
                Enter your current support team size and conversation volume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agents" className="text-slate-700 dark:text-slate-300">Number of Support Agents</Label>
                <Input
                  id="agents"
                  type="number"
                  value={agents}
                  onChange={(e) => setAgents(parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conversations" className="text-slate-700 dark:text-slate-300">Monthly Conversations</Label>
                <Input
                  id="conversations"
                  type="number"
                  value={conversations}
                  onChange={(e) => setConversations(parseInt(e.target.value) || 0)}
                  min="100"
                  step="100"
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-slate-700 dark:text-slate-300">Current Provider</Label>
                <Select value={currentProvider} onValueChange={setCurrentProvider}>
                  <SelectTrigger className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Select your current provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    <SelectItem value="intercom" className="text-slate-900 dark:text-slate-100">Intercom</SelectItem>
                    <SelectItem value="zendesk" className="text-slate-900 dark:text-slate-100">Zendesk</SelectItem>
                    <SelectItem value="freshdesk" className="text-slate-900 dark:text-slate-100">Freshdesk</SelectItem>
                    {/* <SelectItem value="ethiotelecom">EthioTelecom</SelectItem> */}
                    <SelectItem value="other" className="text-slate-900 dark:text-slate-100">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voxePlan" className="text-slate-700 dark:text-slate-300">Voxe Plan</Label>
                <Select value={selectedPlan || ""} onValueChange={setSelectedPlan} disabled={loading || pricingPlans.length === 0}>
                  <SelectTrigger className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder={loading ? "Loading plans..." : pricingPlans.length === 0 ? "No plans available" : "Select Voxe plan"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800">
                    {pricingPlans.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500 dark:text-slate-400">
                        No plans available
                      </div>
                    ) : (
                      pricingPlans
                        .filter(plan => plan.tier !== 'ENTERPRISE')
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id} className="text-slate-900 dark:text-slate-100">
                            {plan.name} - ${plan.price}/{plan.period}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {!loading && pricingPlans.length === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Unable to load pricing plans. Please refresh the page or contact support.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Your Savings
              </CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-300">
                Monthly cost comparison with Voxe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Cost */}
              <div className="bg-red-50 dark:bg-red-50/20 border-2 border-red-200 dark:border-red-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-900">Current Provider</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-800">${results.currentCost}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-700">per month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-800 dark:text-slate-800">{agents} agents</p>
                    <p className="text-sm text-slate-800 dark:text-slate-800">{conversations} conversations</p>
                  </div>
                </div>
              </div>

              {/* Voxe Cost */}
              <div className="bg-blue-50 dark:bg-blue-50/20 border-2 border-blue-200 dark:border-blue-300 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-900">With Voxe</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-800">${results.VoxeCost}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-700">per month</p>
                    {selectedPlan && (
                      <p className="text-xs text-blue-700 dark:text-blue-800 mt-1 font-medium">
                        {pricingPlans.find(p => p.id === selectedPlan)?.name || ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-800 dark:text-slate-800">Unlimited agents</p>
                    <p className="text-sm text-slate-800 dark:text-slate-800">Unlimited conversations</p>
                  </div>
                </div>
              </div>

              {/* Savings */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-100/30 dark:to-blue-50/20 border-2 border-blue-300 dark:border-blue-400 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-blue-800 dark:text-blue-900 mb-2">
                  ${results.savings}
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-900 mb-1">
                  Monthly Savings
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-800">
                  {results.savingsPercentage}% cost reduction
                </p>
              </div>

              {/* Annual Savings */}
              <div className="text-center bg-blue-50 dark:bg-blue-50/20 border-2 border-blue-200 dark:border-blue-300 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-900 mb-1">
                  ${results.savings * 12}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-800">
                  Annual savings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* EthioTelecom Pricing Comparison - Only show when EthioTelecom is selected */}
        {currentProvider === "ethiotelecom" && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-secondary" />
                  EthioTelecom Pricing (ETB)
                </CardTitle>
                <CardDescription>
                  Official EthioTelecom contact center solution pricing in Ethiopian Birr
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Monthly Fee */}
                <div className="bg-secondary/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Fee</p>
                      <p className="text-2xl font-bold text-secondary">
                        {formatETB(ethioTelecomPricing.monthlyFee)}
                      </p>
                      <p className="text-xs text-muted-foreground">per agent per month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Case Management</p>
                      <p className="text-sm text-muted-foreground">Ticketing System</p>
                    </div>
                  </div>
                </div>

                {/* Setup Fees */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">One-Time Setup Fees</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Multi-Channel Agent Bundle</span>
                        <span className="font-medium">{formatETB(ethioTelecomPricing.setupFees.multiChannelAgentBundle)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Each Add-On Module</span>
                        <span className="font-medium">{formatETB(ethioTelecomPricing.setupFees.addOnModule)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">IVR Onboarding Fee</span>
                        <span className="font-medium">{formatETB(ethioTelecomPricing.setupFees.ivrOnboarding)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">SMS Onboarding Fee</span>
                        <span className="font-medium">{formatETB(ethioTelecomPricing.setupFees.smsOnboarding)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Chatbot Setup Fee</span>
                        <span className="font-medium">{formatETB(ethioTelecomPricing.setupFees.chatbotSetup)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Additional Chatbot Channel</span>
                        <span className="font-medium">{formatETB(ethioTelecomPricing.setupFees.additionalChatbotChannel)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Setup Cost */}
                <div className="bg-secondary/10 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {formatETB(totalSetupCost)}
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Total Estimated Setup Cost
                  </p>
                  <p className="text-sm text-muted-foreground">
                    One-time implementation fees
                  </p>
                </div>

                {/* Footer Note */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    EthioTelecom pricing shown in Ethiopian Birr (ETB). No automatic currency conversion applied.
                  </p>
                  <a 
                    href="https://www.ethiotelecom.et/contact-center-solution/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View official EthioTelecom pricing →
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Promotional Banner */}
        <div className="mt-16">
          <HelpPromoBanner />
        </div>
      </div>
    </section>
  )
}
