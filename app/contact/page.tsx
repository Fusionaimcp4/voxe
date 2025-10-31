"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ContactForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  // Check for success parameter from Formspree redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSubmitStatus('success');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage("");

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://formspree.io/f/xpwrloly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          message: formData.message.trim(),
          _subject: `Implementation Plan Request from ${formData.name.trim()}`,
          _replyto: formData.email.trim(),
          _next: window.location.origin + '/contact?success=true',
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: "", email: "", company: "", message: "" });
      } else {
        const errorData = await response.json();
        setSubmitStatus('error');
        setErrorMessage(errorData.error || 'Failed to send message. Please try again or contact us directly.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Request an Implementation Plan
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Ready to transform your customer support with AI? Let's discuss your specific needs and create a tailored implementation plan.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8"
          >
            <h2 className="text-2xl font-semibold mb-6">Get Started Today</h2>
            
            {/* Success Message */}
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-400">Message sent successfully!</h3>
                    <p className="text-sm text-zinc-400">We'll get back to you within 24 hours with your implementation plan.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-sm">✕</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-400">Failed to send message</h3>
                    <p className="text-sm text-zinc-400">{errorMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="your.email@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">
                  Tell us about your needs
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-700 focus:border-zinc-500 outline-none px-4 py-3 text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Describe your current support setup, team size, and what you'd like to achieve with AI-powered support..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  "Request Implementation Plan"
                )}
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
              <h3 className="text-xl font-semibold mb-4">What happens next?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-emerald-400">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Initial Consultation</h4>
                    <p className="text-sm text-zinc-400">We'll review your requirements and current setup</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-emerald-400">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Custom Implementation Plan</h4>
                    <p className="text-sm text-zinc-400">Detailed roadmap tailored to your business needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-emerald-400">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Implementation & Training</h4>
                    <p className="text-sm text-zinc-400">Full setup with team training and documentation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8">
              <h3 className="text-xl font-semibold mb-4">Why choose LocalBox?</h3>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Self-hosted solution - keep your data secure
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Fast implementation - live in days, not months
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Seamless human handoff when needed
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Unlimited AI responses and team members
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Full training and ongoing support
                </li>
              </ul>
            </div>

            <div className="text-center">
              <Link
                href="/integration-process"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                ← Back to Integration Process
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <ContactForm />
    </Suspense>
  );
}
