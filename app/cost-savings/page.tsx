"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, X, AlertTriangle, Zap, Shield, BarChart3, Users, MessageSquare, DollarSign, Clock, Database } from "lucide-react";

export default function CostSavingsPage() {
  const pricingPlans = [
    {
      name: "Starter",
      price: "Contact us",
      description: "Basic support chat setup",
      features: [
        "Deploy chat with branded widget",
        "Inbox agent setup",
        "Basic configuration",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Standard", 
      price: "Contact us",
      description: "Support chat with AI agent",
      features: [
        "Full chat setup with AI responses",
        "FAQ knowledge base",
        "Escalation rules",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Advanced",
      price: "Contact us", 
      description: "Complete AI support system",
      features: [
        "Chat + AI agent + Holding AI",
        "Supervisor notifications",
        "Unattended chat handling",
        "CRM integration",
        "Analytics dashboard",
        "Dedicated support"
      ],
      popular: false
    }
  ];

  const comparisonFeatures = [
    {
      feature: "Agent Seats",
      ours: "Unlimited, no per-seat fees",
      competitors: "$99–$149 per agent/month",
      highlight: true
    },
    {
      feature: "AI Resolutions", 
      ours: "Unlimited, no per-message fee",
      competitors: "$0.99 per AI resolution",
      highlight: true
    },
    {
      feature: "Add-On AI Copilot Seats",
      ours: "Included",
      competitors: "$35–$50 per agent/month",
      highlight: true
    },
    {
      feature: "Hosting",
      ours: "Self-hosted, one-time setup",
      competitors: "Ongoing SaaS subscription",
      highlight: false
    },
    {
      feature: "Data Ownership",
      ours: "✅ 100% yours",
      competitors: "❌ Vendor-controlled servers",
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-zinc-900"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              AI Customer Support Platform
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto leading-relaxed mb-8">
              Unlimited Agents. Unlimited Resolutions. You Own the Data.{" "}
              <span className="text-emerald-400 font-semibold">Save more than 80%.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl transition-colors duration-200"
              >
                Get Started
                <Zap className="w-5 h-5" />
              </Link>
              <Link
                href="/userdemo"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-colors duration-200"
              >
                See Demo
                <MessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">The Problem with Industry Leaders</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Platforms like Intercom and Zendesk charge heavily for every feature and user
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Users, title: "Per Agent Billing", cost: "$99–$149", period: "per seat/month" },
              { icon: MessageSquare, title: "Per AI Resolution", cost: "$0.99", period: "per Fin AI response" },
              { icon: Zap, title: "AI Add-On Seats", cost: "$35–$50", period: "per agent/month" },
              { icon: BarChart3, title: "Extra Charges", cost: "$$$", period: "reporting, integrations, SLA" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 text-center"
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <div className="text-2xl font-bold text-red-400 mb-1">{item.cost}</div>
                <div className="text-sm text-zinc-500">{item.period}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-red-400 mb-3">The Result</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Costs balloon as your team grows, you don't control the infrastructure, 
                  and your customer data lives on someone else's servers.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Solution Section */}
      <section className="py-20 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Our Solution</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              A self-hosted AI support system that delivers enterprise-grade capabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Unlimited Agents", desc: "Add as many as you want, no extra cost" },
              { icon: MessageSquare, title: "Unlimited AI Resolutions", desc: "No per-message surcharges" },
              { icon: DollarSign, title: "One-Time Setup", desc: "Predictable pricing, no SaaS creep" },
              { icon: Database, title: "Own Your Data", desc: "Full control, no vendor lock-in" },
              { icon: Zap, title: "Configurable AI", desc: "You set rules for responses and escalations" },
              { icon: BarChart3, title: "Analytics Included", desc: "SLA metrics, performance, satisfaction" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison Table */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Cost Comparison</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              See how our self-hosted solution compares to industry leaders
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-zinc-900/60 rounded-3xl border border-zinc-800 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-6 font-semibold">Feature</th>
                    <th className="text-left p-6 font-semibold text-emerald-400">Ours (AI + Chatwoot)</th>
                    <th className="text-left p-6 font-semibold text-red-400">Intercom / Zendesk</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className={`border-b border-zinc-800 ${item.highlight ? 'bg-emerald-500/5' : ''}`}>
                      <td className="p-6 font-medium">{item.feature}</td>
                      <td className="p-6 text-emerald-400">{item.ours}</td>
                      <td className="p-6 text-red-400">{item.competitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">
                Bottom Line: You don't pay more as you scale.
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Our Installation Cost</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              One-time setup fees with unlimited usage. No recurring SaaS costs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-zinc-900/60 rounded-3xl border p-8 ${
                  plan.popular 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-zinc-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">{plan.price}</div>
                  <p className="text-zinc-400">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`w-full block text-center py-3 px-6 rounded-2xl font-semibold transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white'
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Why Choose LocalBox?</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Enterprise-grade AI support without enterprise costs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: DollarSign, title: "Predictable Cost Model", desc: "One setup fee, unlimited usage" },
              { icon: Zap, title: "AI-First", desc: "Instant, accurate responses out of the box" },
              { icon: Shield, title: "Configurable", desc: "You decide escalation rules & timing" },
              { icon: Users, title: "Scalable", desc: "Add unlimited agents without cost creep" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Experience */}
      <section className="py-20 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Example Experience</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              What you get with our self-hosted solution
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                "Unlimited agents — never pay per seat",
                "Unlimited AI — never pay per resolution", 
                "Own your data — never be locked in",
                "One setup fee — predictable, scalable, cost-effective"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-8 h-8 text-emerald-400" />
                <h3 className="text-xl font-semibold">Only Running Cost</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Model API usage (minimal, often free via Google Gemini). 
                No per-message fees, no per-agent fees, no hidden costs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-6">Why Pay More?</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              Get enterprise-grade AI support without enterprise costs. 
              Own your data, control your costs, scale without limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 rounded-2xl transition-colors duration-200"
              >
                Get Started
                <Zap className="w-5 h-5" />
              </Link>
              <Link
                href="/integration-process"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-colors duration-200"
              >
                Learn More
                <MessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
