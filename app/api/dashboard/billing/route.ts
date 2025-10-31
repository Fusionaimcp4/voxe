/**
 * Billing Status API
 * Returns current subscription, credits, and recent transactions for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserTransactions } from '@/lib/stripe-db';
import { getDynamicTierLimits } from '@/lib/dynamic-tier-limits';
import { FusionSubAccountService } from '@/lib/fusion-sub-accounts';
import { getUserUsageStats } from '@/lib/usage-tracking';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma!.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        apiCallsThisMonth: true,
        balanceUsd: true,
        stripeSubscriptionId: true,
        fusionSubAccountId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get Fusion usage metrics (costs from Fusion API)
    // These are now handled by getUserUsageStats
    // let fusionSpend = 0;
    // let fusionRequests = 0;
    // if (user.fusionSubAccountId) {
    //   try {
    //     const fusionData = await FusionSubAccountService.getUsageMetrics(parseInt(user.fusionSubAccountId));
    //     fusionSpend = fusionData.metrics?.spend || 0;
    //     fusionRequests = fusionData.metrics?.requests || 0;
    //   } catch (e) {
    //     console.log('No Fusion usage data available');
    //   }
    // }

    // Get combined usage stats
    const usageStats = await getUserUsageStats(session.user.id);

    // Get tier limits for API quota
    const tierLimits = await getDynamicTierLimits(user.subscriptionTier as any);

    // Get recent transactions
    const transactions = await getUserTransactions(session.user.id, 10);

    // Get pricing plan info
    const pricingPlan = await prisma!.pricingPlan.findUnique({
      where: { tier: user.subscriptionTier as any },
    });

    return NextResponse.json({
      subscription: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt,
        stripeSubscriptionId: user.stripeSubscriptionId,
        monthlyPrice: pricingPlan ? Number(pricingPlan.price) : 0,
        currency: pricingPlan?.currency || 'USD',
      },
      apiUsage: {
        callsThisMonth: usageStats.apiCalls,
        fusionRequests: usageStats.fusionRequests,
        fusionSpend: usageStats.fusionSpend,
        includedQuota: tierLimits.apiCallsPerMonth,
        isOverQuota: usageStats.apiCalls > tierLimits.apiCallsPerMonth && tierLimits.apiCallsPerMonth !== -1,
      },
      credits: {
        balance: Number(user.balanceUsd),
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        productType: t.productType,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });

  } catch (error) {
    console.error('Failed to get billing status:', error);
    return NextResponse.json(
      { error: 'Failed to get billing status' },
      { status: 500 }
    );
  }
}
