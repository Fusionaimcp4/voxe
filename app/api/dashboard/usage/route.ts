import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserUsageStats } from '@/lib/usage-tracking';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const usage = await getUserUsageStats(session.user.id);
    
    // Get user's trial expiration date
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        freeTrialEndsAt: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true, // Include createdAt for fallback calculation
      }
    });
    
    // If user is on FREE tier and doesn't have freeTrialEndsAt, calculate it from createdAt (14 days)
    // This handles existing users created before we added freeTrialEndsAt field
    let trialEndDate = user?.freeTrialEndsAt;
    if (!trialEndDate && user?.subscriptionTier === 'FREE' && user?.subscriptionStatus === 'ACTIVE' && user?.createdAt) {
      const createdAt = new Date(user.createdAt);
      const calculatedTrialEnd = new Date(createdAt);
      calculatedTrialEnd.setDate(calculatedTrialEnd.getDate() + 14);
      // Only use calculated date if trial hasn't expired yet (don't show future date for old accounts)
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation < 14) {
        trialEndDate = calculatedTrialEnd;
      }
    }
    
    return NextResponse.json({
      usage,
      freeTrialEndsAt: trialEndDate || null,
      subscriptionTier: user?.subscriptionTier || null,
      subscriptionStatus: user?.subscriptionStatus || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
