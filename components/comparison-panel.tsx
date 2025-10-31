import React from "react"
import { MessageSquare, Sparkles, Users, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function ComparisonPanel() {
  return (
    <section className="w-full py-20 md:py-32 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-5 space-y-32">
        
        {/* Section 1: Support customers on multiple channels */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Support customers on multiple channels
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              Add an AI chatbot to your website, LiveChat, Messenger, or Slack to handle all support cases automatically, 24/7.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-6 text-lg font-semibold rounded-xl">
                Sign up free
              </Button>
            </Link>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
              {/* Channel Icons */}
              <div className="mb-6">
                <Image 
                  src="/images/home__multiple-channels-resize_lanczos_3.png" 
                  alt="Supported platforms: Facebook Messenger, LiveChat, WordPress, Shopify, BigCommerce, Slack, Webflow, Stripe, WooCommerce, Wix"
                  width={1200}
                  height={120}
                  className="w-full h-auto"
                />
              </div>
              {/* Chat Messages */}
              <div className="space-y-3">
                {[
                  { message: "Check my order status.", agent: "/agent1.png" },
                  { message: "How can I change my billing address?", agent: "/agent2.png" },
                  { message: "How can I modify my client's pending order?", agent: "/agent3.png" },
                  { message: "Can you connect me with a sales agent?", agent: "/agent4.png" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={item.agent} alt="Agent" width={36} height={36} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3 shadow-sm flex-1">
                      <p className="text-sm text-slate-900 dark:text-white">{item.message}</p>
                    </div>
                    {i === 0 && (
  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 self-end shadow-sm">
    <Image 
      src="/telegram.png" 
      alt="WeChat" 
      width={24} 
      height={24} 
      className="w-full h-full object-contain"
    />
  </div>
)}
                    {i === 1 && (
  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 self-end shadow-sm">
    <Image 
      src="/email.svg" 
      alt="WeChat" 
      width={24} 
      height={24} 
      className="w-full h-full object-contain"
    />
  </div>
)}
                    {i === 2 && (
  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 self-end shadow-sm">
    <Image 
      src="/whatsapp.svg" 
      alt="WeChat" 
      width={24} 
      height={24} 
      className="w-full h-full object-contain"
    />
  </div>
)}
                    {i === 3 && (
  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 self-end shadow-sm">
    <Image 
      src="/messenger.svg" 
      alt="WeChat" 
      width={24} 
      height={24} 
      className="w-full h-full object-contain"
    />
  </div>
)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Show offers to boost sales */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Show offers to boost sales
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              Proactively reach website visitors with product recommendations to increase engagement and conversions.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-6 text-lg font-semibold rounded-xl">
                Sign up free
              </Button>
            </Link>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image src="/agent1.png" alt="Agent" width={32} height={32} className="w-full h-full object-cover" />
                </div>
              </div>
              {/* User Query */}
              <div className="flex justify-end mb-4">
                <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-slate-900 dark:text-white">
                    looking for glasses blocking blue light and strong sun exposure.
                  </p>
                </div>
              </div>
              {/* AI Response with Products */}
              <div className="bg-blue-500 dark:bg-blue-600 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-white" />
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-white mb-4">
                  Sure! These items have anti-rad filter and block above 80% UV rays:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Sunlort Blue 776", image: "/model2.JPG" },
                    { name: "Sunconer yellow 196", image: "/model1.JPG" }
                  ].map((product, i) => (
                    <div key={i} className="bg-white dark:bg-slate-700 rounded-xl overflow-hidden shadow-md">
                      <div className="w-full h-32 relative overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{product.name}</h4>
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded mb-1 transition-colors">Add to cart</button>
                        <button className="w-full text-blue-500 hover:text-blue-600 text-xs py-1 transition-colors">Try it online</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Deliver on-point answers with AI automation */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
              Deliver on-point answers with AI automation
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              Ensure continuous customer engagement and human-like support without expanding your team.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-6 text-lg font-semibold rounded-xl">
                Sign up free
              </Button>
            </Link>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <div className="w-4 bg-slate-400 rounded" />
                    <div className="w-4 bg-slate-400 rounded" />
                    <div className="w-4 bg-slate-400 rounded" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">AI ChatBot</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                  <div className="w-5 h-3 bg-slate-400 rounded" />
                </div>
              </div>
              {/* User Query */}
              <div className="flex justify-end mb-4">
                <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-[90%]">
                  <p className="text-sm text-slate-900 dark:text-white">
                    My verification code has expired. Could you help me with that?
                  </p>
                </div>
              </div>
              {/* AI Response */}
              <div className="bg-blue-500 dark:bg-blue-600 rounded-2xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  <Sparkles className="w-4 h-4 text-white flex-shrink-0" />
                  <p className="text-sm text-white">
                    Sure! Choose the "request new code" option. Then check your email or phone messages.
                  </p>
                </div>
                <p className="text-xs text-white/70 flex items-center gap-1 mt-3">
                  <Sparkles className="w-3 h-3" />
                  Answered by AI
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
