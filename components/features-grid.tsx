"use client"

import React from "react"
import Image from "next/image"
import { 
  MessageSquare, 
  Mail,
  Globe,
  Zap,
  Bot,
  Shield
} from "lucide-react"

export function FeaturesGrid() {
  const integrations = [
    { name: "WhatsApp", icon: "/whatsapp.svg", color: "bg-green-500" },
    { name: "Telegram", icon: "/telegram.png", color: "bg-blue-400" },
    { name: "Slack", icon: "/slack.svg", color: "bg-purple-600" },
    { name: "Email", icon: "/email.svg", color: "bg-blue-500" },
    { name: "Web Chat", icon: "/webchat.svg", color: "bg-indigo-500" },
    { name: "Messenger", icon: "/messenger.svg", color: "bg-blue-600" },
  ];

  const offerings = [
    {
      icon: Bot,
      title: "AI-Powered Support",
      description: "Instant responses with AI assistants"
    },
    {
      icon: Mail,
      title: "Unified Inbox",
      description: "All channels in one place"
    },
    {
      icon: Zap,
      title: "Smart Automation",
      description: "Workflows that just work"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption"
    },
    {
      icon: Globe,
      title: "Multi-Channel",
      description: "Connect anywhere"
    },
    {
      icon: MessageSquare,
      title: "Real-Time Analytics",
      description: "Data-driven insights"
    }
  ]

  return (
    <section className="w-full px-5 py-20 md:py-32 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">SEAMLESS INTEGRATION</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
            Works with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Everything</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Connect Voxe to any platform. Set up in minutes and start automating support.
          </p>
        </div>

        {/* Main Content - Side by Side */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Integrations */}
          <div className="relative">
            <div className="text-left mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-blue-500" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider">INTEGRATIONS</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Connect to any platform</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Integrate with your existing tools and workflows.</p>
            </div>

            {/* Integration Grid */}
            <div className="grid grid-cols-3 gap-4">
              {integrations.map((integration, index) => (
                <div 
                  key={index}
                  className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-white shadow-sm border border-slate-200`}>
                    <Image
                      src={integration.icon}
                      alt={integration.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{integration.name}</p>
                  </div>
                  
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 -right-6 hidden lg:block w-12 h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-30" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - What We Offer */}
          <div className="relative lg:pl-12">
            <div className="text-left mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-indigo-500" />
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">OUR OFFERINGS</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Complete Support Platform</h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Everything you need to deliver exceptional customer service.</p>
            </div>

            {/* Offerings Grid */}
            <div className="space-y-4">
              {offerings.map((offering, index) => {
                const IconComponent = offering.icon
                return (
                  <div 
                    key={index}
                    className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{offering.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{offering.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Key Features Section */}
        <div className="mt-20 grid md:grid-cols-4 gap-6">
          {[
            "Set up in under an hour",
            "Follows your existing workflows",
            "Escalates to human agents seamlessly",
            "Enterprise-grade security"
          ].map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-900 dark:text-white font-medium">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

