"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ContactModal } from "@/components/contact-modal";

export default function IntegrationProcessPage() {
  const steps = [
    {
      number: "01",
      title: "Knowledge Base Refinement",
      description: "We refine your draft KB with FAQs, support docs, and product info for accurate, on-brand answers.",
      icon: "📚"
    },
    {
      number: "02", 
      title: "System Deployment",
      description: "Deploy the AI support system into your preferred environment (self-hosted or managed by us for a fee).",
      icon: "🚀"
    },
    {
      number: "03",
      title: "Widget Integration", 
      description: "Provide a simple script snippet to add to your site; once placed, the AI widget goes live instantly.",
      icon: "🔗"
    },
    {
      number: "04",
      title: "AI Agent Configuration",
      description: "Set response accuracy (95%+), escalation rules, wait times, and Holding AI follow-ups. Add supervisor alerts if needed.",
      icon: "⚙️"
    },
    {
      number: "05",
      title: "Routing & Handoff",
      description: "AI routes queries to the right team (support, sales, billing, technical) with seamless human takeover.",
      icon: "🎯"
    },
    {
      number: "06",
      title: "Testing & Optimization",
      description: "Run end-to-end tests, fine-tune responses, and validate escalation flows.",
      icon: "🧪"
    },
    {
      number: "07",
      title: "Training & Handover",
      description: "Deliver documentation, runbooks, and training so your team can manage the system with confidence.",
      icon: "🎓"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            How Integration Works
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            From setup to handover, here's how we bring AI-powered support to your business.
          </p>
        </motion.div>

        {/* Integration Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div className="text-6xl font-bold text-emerald-500/20">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-4 text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="text-lg text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connecting Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-8 top-20 w-px h-16 bg-gradient-to-b from-emerald-500/30 to-transparent"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8 mb-16"
        >
          <h2 className="text-2xl font-semibold mb-6 text-center">Why Choose Our Integration Process?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⚡</span>
              </div>
              <h3 className="font-semibold mb-2">Fast Setup</h3>
              <p className="text-sm text-zinc-400">Get your AI support live in days, not months</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🛡️</span>
              </div>
              <h3 className="font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-sm text-zinc-400">Enterprise-grade security with 99.9% uptime</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🎯</span>
              </div>
              <h3 className="font-semibold mb-2">Tailored Solution</h3>
              <p className="text-sm text-zinc-400">Customized to your business needs and workflows</p>
            </div>
          </div>
        </motion.div>

        {/* Call-to-Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-3xl border border-emerald-500/20 p-12">
            <h2 className="text-3xl font-bold mb-4">
              Ready to integrate AI-powered support into your website?
            </h2>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Let's get started today and transform your customer support experience.
            </p>
            <ContactModal>
              <Button className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 transition-colors duration-200">
                Request an Implementation Plan
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </ContactModal>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
