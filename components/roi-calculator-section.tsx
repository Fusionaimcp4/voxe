"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Users, MessageSquare, Zap, ArrowRight, CheckCircle } from "lucide-react"

export function ROICalculatorSection() {
  const [formData, setFormData] = useState({
    monthlyConversations: "1000",
    numberOfAgents: "5",
    currentPerSeatFee: "29",
    perResolutionFee: "0.99",
    cloudHostingCost: "50"
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCalculate = () => {
    // Results update automatically when formData changes
    // This function is kept for the button click handler
  }

  const calculateSavings = () => {
    const conversations = parseInt(formData.monthlyConversations) || 0
    const agents = parseInt(formData.numberOfAgents) || 0
    const perSeatFee = parseFloat(formData.currentPerSeatFee) || 0
    const perResolutionFee = parseFloat(formData.perResolutionFee) || 0
    const hostingCost = parseFloat(formData.cloudHostingCost) || 0

    const monthlySaaSCost = (agents * perSeatFee) + (conversations * perResolutionFee)
    const monthlyVoxeCost = hostingCost
    const monthlySavings = monthlySaaSCost - monthlyVoxeCost
    const annualSavings = monthlySavings * 12

    return {
      monthlySaaSCost,
      monthlyVoxeCost,
      monthlySavings,
      annualSavings,
      savingsPercentage: monthlySaaSCost > 0 ? (monthlySavings / monthlySaaSCost) * 100 : 0
    }
  }

  const results = calculateSavings()

  return (
    <section className="w-full px-5 overflow-hidden flex flex-col justify-start items-center my-0 py-16 md:py-24 bg-gradient-to-b from-background to-muted/10 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
            <Calculator className="w-4 h-4 mr-2" />
            ROI Calculator
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Calculate Your Savings
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how removing per-seat/per-resolution line items + owning infrastructure yields savings after month X.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Card */}
          <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Your Current Costs</CardTitle>
                  <CardDescription className="text-sm">
                    Enter your current support tool costs to see potential savings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conversations" className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Monthly conversations
                  </Label>
                  <Input
                    id="conversations"
                    type="number"
                    placeholder="1000"
                    value={formData.monthlyConversations}
                    onChange={(e) => handleInputChange("monthlyConversations", e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agents" className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    # of agents
                  </Label>
                  <Input
                    id="agents"
                    type="number"
                    placeholder="5"
                    value={formData.numberOfAgents}
                    onChange={(e) => handleInputChange("numberOfAgents", e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perSeat" className="text-sm font-medium">Current per-seat fee ($/month)</Label>
                  <Input
                    id="perSeat"
                    type="number"
                    placeholder="29"
                    value={formData.currentPerSeatFee}
                    onChange={(e) => handleInputChange("currentPerSeatFee", e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perResolution" className="text-sm font-medium">Per-resolution fee ($)</Label>
                  <Input
                    id="perResolution"
                    type="number"
                    placeholder="0.99"
                    value={formData.perResolutionFee}
                    onChange={(e) => handleInputChange("perResolutionFee", e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hosting" className="text-sm font-medium">Your cloud hosting cost ($/month)</Label>
                <Input
                  id="hosting"
                  type="number"
                  placeholder="50"
                  value={formData.cloudHostingCost}
                  onChange={(e) => handleInputChange("cloudHostingCost", e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              
              <Button 
                onClick={handleCalculate} 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Zap className="w-4 h-4 mr-2" />
                Recalculate Savings
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full translate-y-16 -translate-x-16"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-primary">Your Potential Savings</CardTitle>
                    <CardDescription className="text-sm">
                      Most teams see 60-80% cost reduction within 6 months
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-6">
                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground font-medium">Current monthly cost:</span>
                    <span className="text-foreground font-bold text-lg">${results.monthlySaaSCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-primary font-medium">Voxe monthly cost:</span>
                    <span className="text-primary font-bold text-lg">${results.monthlyVoxeCost.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Savings Highlight */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                  <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-primary">
                      ${results.monthlySavings.toFixed(2)}
                    </div>
                    <div className="text-sm font-semibold text-foreground">Monthly Savings</div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <div className="text-muted-foreground">Annual Savings</div>
                        <div className="font-bold text-primary">${results.annualSavings.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Savings %</div>
                        <div className="font-bold text-primary">{results.savingsPercentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Unlimited agents & AI resolutions</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Self-hosted data ownership</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Zero vendor lock-in</span>
                  </div>
                </div>
                
                {/* CTA */}
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg">
                  Get Started Today
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </section>
  )
}
