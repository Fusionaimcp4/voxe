"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Loader2, Info, ArrowLeft, LayoutDashboard, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth'; // Explicitly import Session type
import { FEATURE_MATRIX } from '@/lib/features';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { toast } from 'sonner'; // Added toast import

interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  isPopular: boolean;
  ctaText: string;
  ctaHref: string;
  stripeMonthlyPriceId?: string; // New: Stripe Price ID for monthly subscriptions
  stripeYearlyPriceId?: string;  // New: Stripe Price ID for yearly subscriptions
  annualDiscountPercentage?: number; // Add annualDiscountPercentage
}

interface TierData {
  limits: {
    agents: number;
    inboxes: number;
    captain_responses: number;
    captain_documents: number;
  };
  features: string[];
}

export default function PricingPage() {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [tierData, setTierData] = useState<Record<string, TierData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Type assertion for session user
  const typedSession = session as Session | null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pricing plans
        const plansResponse = await fetch('/api/pricing');
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch pricing plans');
        }
        const plansData = await plansResponse.json();
        setPricingPlans(plansData);

        // Fetch tier data
        const tierResponse = await fetch('/tier/tier.json');
        if (!tierResponse.ok) {
          throw new Error('Failed to fetch tier data');
        }
        const tierJson = await tierResponse.json();
        setTierData(tierJson);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to get tier features in a grouped format
  const getTierFeatures = (tier: SubscriptionTier) => {
    const tierKey = tier === 'STARTER' ? 'STARTER' : tier === 'TEAM' ? 'TEAM' : tier === 'BUSINESS' ? 'BUSINESS' : null;
    if (!tierKey || !tierData[tierKey]) {
      return { limits: null, keyFeatures: [] };
    }

    const data = tierData[tierKey];
    
    // Create a clean, industry-standard feature list
    // Show limits first, then top key features
    const keyFeatures = [
      { icon: Users, label: `${data.limits.agents} Agent Bots` },
      { icon: MessageSquare, label: `${data.limits.inboxes} Inbox Management` },
    ];

    // Add top 4 most important features from the features array
    const importantFeatures = data.features.slice(0, 4);
    importantFeatures.forEach(feature => {
      keyFeatures.push({ icon: Check, label: feature });
    });

    return {
      limits: data.limits,
      keyFeatures: keyFeatures.slice(0, 6), // Limit to 6 features for cleaner display
    };
  };

  const handleCheckout = async (plan: PricingPlan, selectedBillingCycle: 'monthly' | 'yearly', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Check if Stripe Price ID is configured
    const stripePriceId = selectedBillingCycle === 'monthly' ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId;
    if (!stripePriceId) {
      const errorMsg = `This plan is not yet configured for ${selectedBillingCycle} billing. Please contact support or check back later.`;
      toast.error('Plan Not Configured', { description: errorMsg });
      setError(errorMsg);
      return;
    }

    setIsCheckoutLoading(plan.id);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', planId: plan.id, billingCycle: selectedBillingCycle }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
        const errorMsg = errorData.error || `HTTP ${response.status}`;
        // Provide more helpful error message for missing Stripe IDs
        if (errorMsg.includes('Stripe Price ID not configured')) {
          throw new Error(`This plan's payment settings are not configured. Please contact support.`);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'No checkout URL returned');
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate checkout';
      setError(errorMessage);
      toast.error('Checkout failed', { description: errorMessage });
      setIsCheckoutLoading(null);
    }
  };

  // Use typedSession here
  const isFreeTrialExpired = typedSession?.user?.freeTrialEndsAt && new Date(typedSession.user.freeTrialEndsAt) < new Date();
  const userIsFreeTier = typedSession?.user?.subscriptionTier === 'FREE';

  const formatPrice = (price: number, currency: string, period: string, tier: SubscriptionTier, annualDiscountPercentage?: number) => {
    if (tier === 'ENTERPRISE') {
      return null; // Don't show price for Enterprise
    }
    if (price === 0 && period === 'contact us') {
      return 'Custom';
    }
    if (price === 0) {
      return '$0';
    }

    let displayPrice = price;
    if (billingCycle === 'yearly') {
      displayPrice = price * 12; // Start with annual price
      const discountPct = annualDiscountPercentage && annualDiscountPercentage > 0 ? annualDiscountPercentage : 15; // Default to 15% if missing or 0
      displayPrice = displayPrice * (1 - discountPct / 100);
    }
    
    return `$${displayPrice.toFixed(0)}`;
  };

  const getTierLimits = (tier: SubscriptionTier) => {
    return FEATURE_MATRIX[tier] || FEATURE_MATRIX.FREE;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8">
          <p className="text-red-600 dark:text-red-400 mb-6 text-base sm:text-lg font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              href={typedSession ? "/dashboard" : "/"}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm sm:text-base">
                {typedSession ? "Back to Dashboard" : "Back to Home"}
              </span>
            </Link>
            {typedSession && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6">
              Choose Your Plan
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto px-4">
              Start free and scale as you grow. All plans include core features with no hidden fees.
            </p>
          </motion.div>

          {/* Billing Cycle Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mt-8 sm:mt-10 mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  billingCycle === 'monthly' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-105' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${
                  billingCycle === 'yearly' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Yearly
                {billingCycle === 'yearly' ? (
                  <span className="ml-2 text-xs px-2.5 py-1 bg-emerald-700 rounded-lg font-bold shadow-sm">Save 15%</span>
                ) : (
                  <span className="ml-2 text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg font-semibold">Save 15%</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {pricingPlans
              .filter(plan => plan.tier !== 'FREE') // Filter out the 'FREE' tier
              .sort((a, b) => {
                const tierOrder = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE']; // Re-define tierOrder locally for sorting consistency
                return tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
              })
              .map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white dark:bg-slate-800 rounded-3xl border-2 transition-all duration-300 overflow-hidden ${
                  plan.isPopular 
                    ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20 md:scale-105 md:-mt-4 ring-4 ring-emerald-500/10' 
                    : 'border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-1'
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/50 backdrop-blur-sm">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Gradient Background for Popular Plan */}
                {plan.isPopular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-blue-50/30 dark:from-emerald-900/10 dark:via-transparent dark:to-blue-900/10 pointer-events-none" />
                )}

                <div className="relative">
                  {/* Tier Name & Price */}
                  <div className="text-center pt-8 pb-6 px-6 border-b border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      {formatPrice(plan.price, plan.currency, plan.period, plan.tier, plan.annualDiscountPercentage) !== null ? (
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            {formatPrice(plan.price, plan.currency, plan.period, plan.tier, plan.annualDiscountPercentage)}
                          </span>
                          <span className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium">
                            {billingCycle === 'yearly' ? '/year' : '/month'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xl sm:text-4xl font-bold text-slate-600 dark:text-slate-400">
                          Contact us
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features - Using tier.json data */}
                  <div className="py-6 px-6 space-y-4 min-h-[280px] flex flex-col">
                    <div className="flex-1 space-y-3.5">
                      {(() => {
                        const tierFeatures = getTierFeatures(plan.tier);
                        if (!tierFeatures.limits && tierFeatures.keyFeatures.length === 0) {
                          // Fallback to database features if tier.json not loaded
                          return plan.features.slice(0, 6).map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start gap-3 group">
                              <div className="mt-0.5 flex-shrink-0">
                                <Check className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                              </div>
                              <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                {feature}
                              </span>
                            </div>
                          ));
                        }

                        return tierFeatures.keyFeatures.map((feature, featureIndex) => {
                          const IconComponent = feature.icon;
                          return (
                            <div key={featureIndex} className="flex items-start gap-3 group">
                              <div className="mt-0.5 flex-shrink-0">
                                <IconComponent className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                              </div>
                              <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                                {feature.label}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* CTA Button */}
                    <div className="pt-4 mt-auto">
                      {plan.tier === 'ENTERPRISE' ? (
                        <Link
                          href="/contact"
                          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base text-center transition-all duration-300 ${
                            plan.isPopular 
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105' 
                              : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 shadow-md hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          {plan.ctaText || 'Contact Us'}
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout(plan, billingCycle, e);
                          }}
                          disabled={isCheckoutLoading === plan.id || !(billingCycle === 'monthly' ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId)}
                          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base text-center transition-all duration-300 ${
                            plan.isPopular 
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-lg' 
                              : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 shadow-md hover:shadow-xl hover:scale-105 disabled:hover:scale-100'
                          } ${isCheckoutLoading === plan.id || !(billingCycle === 'monthly' ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId) ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title={!(billingCycle === 'monthly' ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId) ? 'Payment configuration pending' : ''}
                        >
                          {isCheckoutLoading === plan.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              {plan.ctaText}
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Free trial status message */}
                {plan.tier === 'FREE' && userIsFreeTier && typedSession?.user?.freeTrialEndsAt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <Info className="w-4 h-4 flex-shrink-0" />
                    {isFreeTrialExpired ? (
                      <span>Your free trial has ended. Please upgrade to continue.</span>
                    ) : (
                      <span>Free trial ends {new Date(typedSession.user.freeTrialEndsAt).toLocaleDateString()}.</span>
                    )}
                  </motion.div>
                )}

                {plan.tier !== 'FREE' && userIsFreeTier && isFreeTrialExpired && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Your free trial has ended. Please upgrade.</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison */}
          

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Can I change plans anytime?
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  What happens if I exceed my limits?
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                If you exceed your limits, you can use our top-up system to add credits and cover the LLM costs, allowing you to continue using the service..
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Is there a free trial?
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  Yes, all paid plans come with a 14-day free trial. No credit card required.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
