"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

export function BentoSection() {
  return (
    <section className="w-full px-5 py-16 md:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Flexible ways to build your all-in-one AI chatbot
          </h2>
        </div>

        {/* Feature 1: Instant Deployment with Web Scraping */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-32">
          <div className="lg:w-1/2 space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Deploy in seconds with web scraping
            </h3>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Get your AI chatbot running instantly using our web scraping tool. Simply provide your website URL, and we'll automatically extract all relevant information, create your knowledge base, and deploy your chatbot within seconds.
            </p>
            <a href="#" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
              Learn more
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 shadow-2xl border border-slate-700 overflow-hidden">
              {/* Video Placeholder */}
              <div className="relative aspect-video bg-slate-800 rounded-xl">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src="/videos/scraping-deployment-demo.mp4"
                />
                
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Smart Context Management */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 mb-32">
          <div className="lg:w-1/2 space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Knowledge Base Support
            </h3>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Build your knowledge base in seconds with simple drag-and-drop. Upload any document, and it's instantly processed with RAG (Retrieval-Augmented Generation), making every answer accurate and context-aware. Supports both your AI and human agents for seamless customer support.
            </p>
            <a href="#" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
              Learn more
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 shadow-2xl border border-slate-700 overflow-hidden">
              {/* Video Placeholder */}
              <div className="relative aspect-video bg-slate-800 rounded-xl">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src="/videos/context-management-demo.mp4"
                />

              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Supervisor Notifications */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-32">
          <div className="lg:w-1/2 space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Smart supervisor alerts
            </h3>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              When the primary AI escalates to your human team, a secondary AI assistant maintains real-time monitoring. It tracks attendance and response times, keeps customers engaged during wait periods, and automatically notifies supervisors when chats remain unattended after assignment.
            </p>
            <a href="#" className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
              Learn more
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 shadow-2xl border border-slate-700 overflow-hidden">
              {/* Video Placeholder */}
              <div className="relative aspect-video bg-slate-800 rounded-xl">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src="/videos/supervisor-notifications-demo.mp4"
                />
                
              </div>
            </div>
          </div>
        </div>

        {/* Handover to live agents - Video Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Handover to live agents seamlessly
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Combine AI efficiency with human expertise. When AI can't resolve an issue, it smoothly escalates to your team while maintaining full context.
            </p>
          </div>
          
          <a href="#" className="flex items-center justify-center mb-8">
            <button className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
              Add live agents to Chatbot
            </button>
          </a>

          {/* Video Box - Orange Background */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
  {/* Image Section */}
  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20">
    <img
      className="w-full h-full object-cover"
      src="/videos/handover-demo.png"
      alt="Handover workflow preview"
    />

    {/* Optional overlay for design consistency */}
    
  
</div>

        </div>
        </div>

      </div>
    </section>
  )
}
