"use client"

import Link from "next/link"
import { ArrowRight, Zap, Shield, Globe } from "lucide-react"
import Image from "next/image"

export function HelpPromoBanner() {
  return (
    <div className="relative w-full my-12">
      {/* Image on Top */}
      <div className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 mt-5">
        <div className="relative w-full h-65 sm:h-80 lg:h-96 overflow-hidden">
          <Image
            src="/help.png"
            alt="Voxe Help Center"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </div>

      {/* Banner Content Below */}
      <div className="relative w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-b-2xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
        </div>

        <div className="relative z-10 px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-white space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Build AI chatbots like a pro
                </h2>
                <p className="text-lg sm:text-xl text-blue-50 leading-relaxed max-w-3xl mx-auto">
                  Take control of your customer support with Voxe. Create unlimited AI-powered chatbots, manage knowledge bases, and automate workflows—all with complete data ownership.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Unlimited AI</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Self-Hosted</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  <Globe className="w-4 h-4" />
                  <span>No Lock-in</span>
                </div>
              </div>

              {/* CTA Button */}
              <div>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-blue-100 text-sm mt-3">
                  Start your 14-day free trial • No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

