"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { canAccessFeature, getUpgradePrompt } from '@/lib/features';
import { motion } from 'framer-motion';
import { Crown, Lock, ArrowUp } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  children: React.ReactNode;
  feature?: string;
  tier?: SubscriptionTier;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

export function FeatureGate({ 
  children, 
  feature, 
  tier = 'FREE', 
  fallback, 
  showUpgradePrompt = true,
  className = ''
}: FeatureGateProps) {
  const { data: session } = useSession();
  const userTier = (session?.user?.subscriptionTier as SubscriptionTier) || 'FREE';

  // Check if user has access to the feature
  const hasAccess = feature ? canAccessFeature(userTier, tier) : true;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (showUpgradePrompt) {
    return (
      <div className={`relative ${className}`}>
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
        
        {/* Overlay with upgrade prompt */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 max-w-sm"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {tier} Feature
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {getUpgradePrompt(userTier, feature || '')}
            </p>
            
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
            >
              <ArrowUp className="w-4 h-4" />
              Upgrade to {tier}
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Hide content if no upgrade prompt
  return null;
}

// Usage limit component
interface UsageLimitProps {
  current: number;
  limit: number;
  label: string;
  className?: string;
}

export function UsageLimit({ current, limit, label, className = '' }: UsageLimitProps) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const status = percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'safe';
  
  const statusColors = {
    safe: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {limit === -1 ? 'Unlimited' : `${current}/${limit}`}
        </span>
      </div>
      
      {limit !== -1 && (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${statusColors[status]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      
      {status !== 'safe' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {status === 'critical' ? 'Limit reached — upgrade to unlock more.' : 'Approaching limit'}
        </p>
      )}
    </div>
  );
}

// Tier badge component
interface TierBadgeProps {
  tier: SubscriptionTier;
  className?: string;
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
  const tierConfig = {
    FREE: { 
      label: 'Free', 
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      icon: null
    },
    PRO: { 
      label: 'Pro', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: <Crown className="w-3 h-3" />
    },
    PRO_PLUS: { 
      label: 'Pro+', 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      icon: <Crown className="w-3 h-3" />
    },
    STARTER: {
      label: 'Starter',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: <Crown className="w-3 h-3" />
    },
    TEAM: {
      label: 'Team',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      icon: <Crown className="w-3 h-3" />
    },
    BUSINESS: {
      label: 'Business',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      icon: <Crown className="w-3 h-3" />
    },
    ENTERPRISE: { 
      label: 'Enterprise', 
      color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900 dark:to-orange-900 dark:text-amber-300',
      icon: <Crown className="w-3 h-3" />
    }
  };

  const config = tierConfig[tier];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// Upgrade prompt component
interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  feature?: string;
  className?: string;
}

export function UpgradePrompt({ currentTier, requiredTier, feature, className = '' }: UpgradePromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
          <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Upgrade Required
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {feature ? `${feature} requires ${requiredTier} tier or higher.` : `This feature requires ${requiredTier} tier or higher.`}
          </p>
          
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <ArrowUp className="w-4 h-4" />
            Upgrade to {requiredTier}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
