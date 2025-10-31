import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { getDynamicTierLimits } from '@/lib/dynamic-tier-limits';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as SubscriptionTier;

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier parameter is required' },
        { status: 400 }
      );
    }

    // Fetch dynamic tier limits from database
    const limits = await getDynamicTierLimits(tier);
    
    return NextResponse.json({
      success: true,
      limits
    });
  } catch (error) {
    console.error('Failed to fetch tier limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
