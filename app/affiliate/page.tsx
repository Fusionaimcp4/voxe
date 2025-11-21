"use client";

import { useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/footer-section";
import { Button } from "@/components/ui/button";
import { Check, DollarSign, TrendingUp, Users, Shield, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AffiliateProgramPage() {
  const widgetRef = useRef<HTMLDivElement>(null);

  // Load ReferralRocket widget scripts
  useEffect(() => {
    // Add script to HEAD
    if (typeof window !== 'undefined') {
      // Check if script is already loaded
      if (!document.querySelector('script[data-referralrocket-head]')) {
        const headScript = document.createElement('script');
        headScript.type = 'text/javascript';
        headScript.setAttribute('campaign-id', '6eMJMYDA');
        headScript.defer = true;
        headScript.src = 'https://app.referralrocket.io/widget/widgetIndex.js';
        headScript.setAttribute('data-referralrocket-head', 'true');
        
        // Add error handling to prevent undefined requests
        headScript.onerror = () => {
          console.warn('[ReferralRocket] Failed to load widget script');
        };
        
        document.head.appendChild(headScript);
      }

      // Set campaign-id attribute on widget div after a short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (widgetRef.current) {
          widgetRef.current.setAttribute('campaign-id', '6eMJMYDA');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Join the Voxe Affiliate Program!
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Earn generous commissions by promoting Voxe — the AI-powered customer support platform built for modern businesses.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Program Details */}
          <div className="mb-16">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 md:p-10 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                Program Details
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Voxe's affiliate program rewards creators, agencies, founders, and influencers who introduce new customers to our AI customer support platform. Partners earn commissions for every paid subscription generated through their unique link.
                </p>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  You'll help businesses upgrade their customer support while earning passive income. Our product sells itself — instant AI support, hybrid automation, and unlimited agents at a fraction of the normal cost.
                </p>
                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  No technical experience required. Share your link, track your conversions, and get paid monthly.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section with ReferralRocket Widget */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border border-primary/20 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Join our affiliate program today and start earning commissions by sharing Voxe with your audience.
            </p>
            
            {/* ReferralRocket Widget */}
            <div className="max-w-2xl mx-auto mb-8">
              <div 
                ref={widgetRef}
                className="hype_widget"
              ></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/pricing-page">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                  View Pricing
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-slate-300 dark:border-slate-600">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}

