"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DollarSign, BarChart3, Package, CreditCard, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillingResponse {
  subscription: {
    tier: string;
    status: string;
    expiresAt: string | null;
    stripeSubscriptionId: string | null;
    monthlyPrice: number;
    currency: string;
  };
  apiUsage: {
    callsThisMonth: number;
    fusionRequests?: number;
    fusionSpend?: number;
    includedQuota: number;
    isOverQuota: boolean;
  };
  credits: { balance: number };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    productType: string;
    description: string | null;
    createdAt: string;
  }>;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<'topup' | null>(null);
  const [customTopup, setCustomTopup] = useState<string>('');

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/billing');
        if (!res.ok) throw new Error('Failed to load billing');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError('Failed to load billing');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openPortal = async () => {
    const r = await fetch('/api/stripe/customer-portal');
    const j = await r.json();
    if (j?.url) window.location.href = j.url;
  };

  const createTopup = async (amountUsd: number) => {
    setCreating('topup');
    try {
      const r = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'topup', amountUsd })
      });
      const j = await r.json();
      if (j.checkoutUrl) window.location.href = j.checkoutUrl;
    } finally {
      setCreating(null);
    }
  };

  // Upgrades are selected on the pricing page to avoid planId ambiguity
  const upgradeLink = '/pricing';

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 mb-2"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-64"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
          ))}
        </div>
        
        {/* Integrations Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="max-w-4xl mx-auto text-red-600">{error || 'No data'}</div>
      </div>
    );
  }

  const { subscription, apiUsage, credits, transactions } = data;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Billing & Plans
            </h1>
            {/* Tier Badge (optional, based on integration page) */}
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage your subscription, credits, and payment history.
          </p>
        </div>
        {/* Optional Add Integration button from Integrations page, not directly applicable here */}
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        {/* Plan Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Plan</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{subscription.tier}</div>
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Status: <span className="font-medium text-emerald-600 dark:text-emerald-400">{subscription.status}</span>
            {subscription.expiresAt && ` until ${new Date(subscription.expiresAt).toLocaleDateString()}`}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={openPortal} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium min-h-[48px]">
              <CreditCard className="w-5 h-5" /> Manage Subscription
            </button>
            <Link href={upgradeLink} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-lg shadow-emerald-500/25 min-h-[48px]">
              <Package className="w-5 h-5" /> Upgrade Plan
            </Link>
          </div>
        </motion.div>

        {/* API Usage Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Monthly Usage</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {apiUsage.callsThisMonth} / {apiUsage.includedQuota === -1 ? '∞' : apiUsage.includedQuota}
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            <span className="font-medium text-blue-600 dark:text-blue-400">API:</span> {apiUsage.fusionRequests ?? 0} requests, ${apiUsage.fusionSpend?.toFixed(2) ?? '0.00'} spent
          </div>
          {apiUsage.isOverQuota && apiUsage.includedQuota !== -1 && (
            <div className="text-orange-600 dark:text-orange-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" /> Over quota! Billing from balance.
            </div>
          )}
          {!apiUsage.isOverQuota && apiUsage.includedQuota !== -1 && (
            <div className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Within monthly quota.
            </div>
          )}
        </motion.div>

        {/* Credits Balance Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Current Balance</h3>
          </div>
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">${credits.balance.toFixed(2)}</div>
          <div className="text-slate-600 dark:text-slate-400 text-sm mb-4">Funds available for over-quota API usage.</div>
          <div className="flex flex-col gap-2">
            <div className="font-medium text-slate-700 dark:text-slate-300 text-sm mb-1">Add Funds:</div>
          <div className="flex flex-wrap gap-2">
            {[25, 50, 100].map(a => (
              <button
                key={a}
                disabled={creating === 'topup'}
                onClick={() => createTopup(a)}
                className="flex-1 min-w-[70px] px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {creating === 'topup' ? <Loader2 className="w-4 h-4 animate-spin" /> : null } +${a}
              </button>
            ))}
            <input
              type="number"
              min={1}
              placeholder="+ Custom"
              value={customTopup}
              onChange={(e) => setCustomTopup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(value) && value > 0) {
                    createTopup(value);
                  }
                }
              }}
              className="flex-1 min-w-[90px] px-3 py-2 bg-blue-600 text-white rounded-lg placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/60 transition-colors text-sm font-medium"
              disabled={creating === 'topup'}
            />
            <button
              type="button"
              disabled={creating === 'topup' || Number(customTopup) <= 0 || Number.isNaN(Number(customTopup))}
              onClick={() => {
                const value = Number(customTopup);
                if (!Number.isNaN(value) && value > 0) {
                  createTopup(value);
                }
              }}
              className="flex-1 min-w-[90px] px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating === 'topup' ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Add'}
            </button>
          </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        variants={cardVariants} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Transactions</h3>
        </div>
        <div className="text-sm divide-y">
          {transactions.length === 0 && <div className="text-slate-500 py-4">No transactions yet</div>}
          {transactions.map(t => (
            <div key={t.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.type.replace(/_/g,' ')}</div>
                <div className="text-slate-500 text-xs">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{t.amount === 0 ? '-' : `$${t.amount.toFixed(2)}`} {t.currency}</div>
                <div className={`text-xs ${t.status === 'COMPLETED' ? 'text-emerald-500' : t.status === 'FAILED' ? 'text-red-500' : 'text-slate-500'}`}>
                  {t.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


