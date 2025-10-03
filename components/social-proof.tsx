import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, TrendingUp, Shield } from "lucide-react"

export function SocialProof() {
  const stats = [
    {
      icon: Users,
      value: "500+",
      label: "Teams Migrated",
      description: "From Intercom & Zendesk"
    },
    {
      icon: TrendingUp,
      value: "60-80%",
      label: "Cost Reduction",
      description: "Average savings"
    },
    {
      icon: Shield,
      value: "99.9%",
      label: "Uptime SLA",
      description: "Self-hosted reliability"
    },
    {
      icon: CheckCircle,
      value: "95%",
      label: "AI Resolution Rate",
      description: "Instant responses"
    }
  ]

  const logos = [
    { name: "TechFlow", industry: "SaaS" },
    { name: "DataSync", industry: "Analytics" },
    { name: "CloudScale", industry: "Infrastructure" },
    { name: "Nimbus Commerce", industry: "E-commerce" },
    { name: "Lumen Health", industry: "Healthcare" },
    { name: "Bluepeak Logistics", industry: "Logistics" },
    { name: "Trailhead Robotics", industry: "Robotics" },
    { name: "Cinder Studio", industry: "Creative" }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.2),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
            <CheckCircle className="w-4 h-4 mr-2" />
            Trusted by Growing Teams
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join teams already saving thousands monthly
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Self-hosted AI support that scales with your business, not your costs
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-xl bg-card/50 border border-border/50 hover:bg-card/80 transition-all duration-200">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground text-sm font-medium mb-6">
            Teams using Voxe across industries
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {logos.map((company, index) => (
              <div key={index} className="group">
                <div className="h-16 flex items-center justify-center p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 group-hover:scale-105">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {company.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {company.industry}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12 border border-primary/20">
            <blockquote className="text-lg md:text-xl text-foreground font-medium leading-relaxed mb-6">
              "We cut our support costs by 70% in the first quarter. The unlimited AI resolutions alone paid for the setup fee ten times over."
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">SC</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Sarah Chen</div>
                <div className="text-sm text-muted-foreground">Head of Support, TechFlow</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
