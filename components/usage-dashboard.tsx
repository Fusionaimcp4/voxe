"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Crown,
  ArrowUp,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { getTierLimits, getUsagePercentage, getUsageStatus } from '@/lib/features';
import { UsageStats } from '@/lib/tier-access';
import { TierBadge, UsageLimit } from '@/components/feature-gate';
import { DynamicTierLimits } from '@/lib/dynamic-tier-limits';

interface UsageDashboardProps {
  className?: string;
}

export function UsageDashboard({ className = '' }: UsageDashboardProps) {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [limits, setLimits] = useState<DynamicTierLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [freeTrialEndsAt, setFreeTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const userTier = (session?.user?.subscriptionTier as SubscriptionTier) || 'FREE';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch usage stats and tier limits in parallel
        const [usageResponse, limitsResponse] = await Promise.all([
          fetch('/api/dashboard/usage'),
          fetch(`/api/dashboard/tier-limits?tier=${userTier}`)
        ]);

        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsage(usageData.usage);
          // Set trial expiration date if available (from API or session fallback)
          if (usageData.freeTrialEndsAt) {
            const trialDate = new Date(usageData.freeTrialEndsAt);
            setFreeTrialEndsAt(trialDate);
          } else if (session?.user?.freeTrialEndsAt) {
            // Fallback to session value if API doesn't return it
            const trialDate = new Date(session.user.freeTrialEndsAt);
            setFreeTrialEndsAt(trialDate);
          }
          if (usageData.subscriptionStatus) {
            setSubscriptionStatus(usageData.subscriptionStatus);
          } else if (session?.user?.subscriptionStatus) {
            // Fallback to session value
            setSubscriptionStatus(session.user.subscriptionStatus);
          }
        } else {
          // If API fails, try to use session values
          if (session?.user?.freeTrialEndsAt) {
            const trialDate = new Date(session.user.freeTrialEndsAt);
            setFreeTrialEndsAt(trialDate);
          }
          if (session?.user?.subscriptionStatus) {
            setSubscriptionStatus(session.user.subscriptionStatus);
          }
        }

        if (limitsResponse.ok) {
          const limitsData = await limitsResponse.json();
          setLimits(limitsData.limits);
        } else {
          // Fallback to hardcoded limits if API fails
          const fallbackLimits = getTierLimits(userTier);
          setLimits(fallbackLimits as unknown as DynamicTierLimits);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fallback to hardcoded limits on error
        const fallbackLimits = getTierLimits(userTier);
        setLimits(fallbackLimits as unknown as DynamicTierLimits);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userTier]);

  if (loading || !limits || !usage) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 ${className}`}>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Unable to load usage data
          </div>
        )}
      </div>
    );
  }

  const usageItems = [
    {
      label: 'Demos',
      current: usage.demos,
      limit: limits.maxDemos,
      icon: BarChart3
    },
    {
      label: 'Workflows',
      current: usage.workflows,
      limit: limits.maxWorkflows,
      icon: TrendingUp
    },
    {
      label: 'Knowledge Bases',
      current: usage.knowledgeBases,
      limit: limits.maxKnowledgeBases,
      icon: BarChart3
    },
    {
      label: 'Documents',
      current: usage.documents,
      limit: limits.maxDocuments,
      icon: BarChart3
    },
    {
      label: 'Integrations',
      current: usage.integrations,
      limit: limits.maxIntegrations,
      icon: BarChart3
    },
    {
      label: 'Helpdesk Agents',
      current: usage.helpdeskAgents,
      limit: limits.maxHelpdeskAgents,
      icon: BarChart3
    },
    {
      label: 'API Calls',
      current: usage.apiCalls,
      limit: limits.apiCallsPerMonth,
      icon: Zap
    }
  ];

  const hasWarnings = usageItems.some(item => {
    const percentage = getUsagePercentage(item.current, item.limit);
    return percentage >= 75;
  });

  const hasCritical = usageItems.some(item => {
    const percentage = getUsagePercentage(item.current, item.limit);
    return percentage >= 90;
  });

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Usage Overview
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <TierBadge tier={userTier} />
              {hasCritical && (
                <></>
              )}
              {hasWarnings && !hasCritical && (
                <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Approaching Limits
                </span>
              )}
              {!hasWarnings && (
                <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  All Good
                </span>
              )}
              {/* Free Trial Expiration Display */}
              {userTier === 'FREE' && (
                (() => {
                  // Try to get trial end date from state or session
                  let trialEndDate = freeTrialEndsAt || (session?.user?.freeTrialEndsAt ? new Date(session.user.freeTrialEndsAt) : null);
                  const currentStatus = subscriptionStatus || (session?.user?.subscriptionStatus as string) || 'ACTIVE';
                  
                  
                  // Show trial expiration if date exists and status is ACTIVE, or if status is EXPIRED
                  if (currentStatus === 'EXPIRED') {
                    return (
                      <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Trial Expired
                      </span>
                    );
                  } else if (trialEndDate && currentStatus === 'ACTIVE') {
                    const now = new Date();
                    const trialEnd = new Date(trialEndDate);
                    const isExpired = trialEnd < now;
                    const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (isExpired) {
                      return (
                        <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Trial Expired
                        </span>
                      );
                    } else if (daysRemaining <= 3) {
                      return (
                        <span className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                        </span>
                      );
                    } else {
                      // Always show days remaining, not just date
                      return (
                        <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                        </span>
                      );
                    }
                  } else if (currentStatus === 'ACTIVE') {
                    // If FREE tier with ACTIVE status but no trial date, show generic message
                    // This should not happen for new users, but might for existing users
                    return (
                      <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Free Trial Active
                      </span>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs sm:text-sm font-medium"
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Hide Usage</span>
                <span className="sm:hidden">Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Show Usage</span>
                <span className="sm:hidden">Show</span>
              </>
            )}
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </button>

          {userTier !== 'ENTERPRISE' && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 text-xs sm:text-sm font-medium"
            >
              <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Usage Items */}
            <div className="space-y-4">
              {usageItems.map((item, index) => {
                const Icon = item.icon;
                const percentage = getUsagePercentage(item.current, item.limit);
                const status = getUsageStatus(item.current, item.limit);
                
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <UsageLimit
                      current={item.current}
                      limit={item.limit}
                      label={item.label}
                      className=""
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Trial Expiration Warning */}
            {userTier === 'FREE' && (
              (() => {
                // Try to get trial end date from state or session
                const trialEndDate = freeTrialEndsAt || (session?.user?.freeTrialEndsAt ? new Date(session.user.freeTrialEndsAt) : null);
                const currentStatus = subscriptionStatus || (session?.user?.subscriptionStatus as string) || 'ACTIVE';
                
                // Handle expired status
                if (currentStatus === 'EXPIRED') {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="mt-6 p-4 rounded-xl border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                          <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 text-red-900 dark:text-red-100">
                            Free Trial Has Ended
                          </h4>
                          <p className="text-sm mb-3 text-red-700 dark:text-red-300">
                            Your free trial has expired. Upgrade now to continue using all features and avoid any service interruptions.
                          </p>
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                          >
                            <Crown className="w-4 h-4" />
                            Upgrade Now
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                }
                // Handle active trial with expiration date
                if (trialEndDate && currentStatus === 'ACTIVE') {
                  const now = new Date();
                  const trialEnd = new Date(trialEndDate);
                  const isExpired = trialEnd < now;
                  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (isExpired || daysRemaining <= 3) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className={`mt-6 p-4 rounded-xl border ${
                          isExpired
                            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
                            : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isExpired
                              ? 'bg-red-100 dark:bg-red-900'
                              : 'bg-orange-100 dark:bg-orange-900'
                          }`}>
                            <Clock className={`w-4 h-4 ${
                              isExpired
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-orange-600 dark:text-orange-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-1 ${
                              isExpired
                                ? 'text-red-900 dark:text-red-100'
                                : 'text-orange-900 dark:text-orange-100'
                            }`}>
                              {isExpired ? 'Free Trial Has Ended' : `Free Trial Ends in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`}
                            </h4>
                            <p className={`text-sm mb-3 ${
                              isExpired
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-orange-700 dark:text-orange-300'
                            }`}>
                              {isExpired
                                ? `Your free trial ended on ${trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Upgrade to continue using all features.`
                                : `Your free trial ends on ${trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Upgrade now to continue without interruption.`
                              }
                            </p>
                            <Link
                              href="/pricing"
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                                isExpired
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-orange-600 text-white hover:bg-orange-700'
                              }`}
                            >
                              <Crown className="w-4 h-4" />
                              Upgrade Now
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                }
                return null;
              })()
            )}

            {/* Upgrade Prompt */}
            {hasWarnings && userTier !== 'ENTERPRISE' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {hasCritical ? 'Limits Reached' : 'Approaching Limits'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {hasCritical 
                        ? 'You have reached your current plan limits. Upgrade to increase your limits.'
                        : 'You are approaching your current plan limits. Consider upgrading to avoid interruptions.'
                      }
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Crown className="w-4 h-4" />
                      View Plans
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tier Benefits */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                {userTier} Plan Benefits
              </h4>
              <div className="space-y-2">
                {(() => {
                  // Get features from hardcoded FEATURE_MATRIX since DynamicTierLimits doesn't include them
                  const tierFeatures = getTierLimits(userTier);
                  return tierFeatures.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
