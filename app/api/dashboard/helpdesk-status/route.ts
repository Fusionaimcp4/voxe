import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasActiveHelpdesk } from '@/lib/usage-tracking';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const userId = session.user.id;
    const userTier = (session.user.subscriptionTier as string) || 'FREE';
    const isPaidUser = userTier !== 'FREE';

    // Check if user has active helpdesk
    const hasHelpdesk = await hasActiveHelpdesk(userId);

    return NextResponse.json({
      hasHelpdesk,
      isPaidUser,
      userTier,
      requiresHelpdesk: isPaidUser && !hasHelpdesk,
    });
  } catch (error) {
    console.error('Failed to get helpdesk status:', error);
    return NextResponse.json(
      { error: 'Failed to get helpdesk status' },
      { status: 500 }
    );
  }
}

