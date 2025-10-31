import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { 
  getAllTierLimits, 
  updateTierLimits, 
  clearTierLimitsCache 
} from '@/lib/dynamic-tier-limits';

// GET - Get all tier limits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const tierLimits = await getAllTierLimits();
    
    return NextResponse.json({
      success: true,
      tierLimits
    });
  } catch (error) {
    console.error('Failed to fetch tier limits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier limits' },
      { status: 500 }
    );
  }
}

// PUT - Update tier limits
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tier, limits } = body;

    if (!tier || !limits) {
      return NextResponse.json(
        { error: 'Tier and limits are required' },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Validate limits
    const requiredFields = [
      'maxDemos', 'maxWorkflows', 'maxKnowledgeBases', 
      'maxDocuments', 'maxIntegrations', 'maxHelpdeskAgents',
      'apiCallsPerMonth', 'documentSizeLimit', 'chunkSize', 
      'maxChunksPerDocument'
    ];

    for (const field of requiredFields) {
      if (limits[field] === undefined || limits[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Update tier limits
    await updateTierLimits(tier, limits);

    return NextResponse.json({
      success: true,
      message: `Tier limits updated for ${tier}`,
      tier,
      limits
    });
  } catch (error) {
    console.error('Failed to update tier limits:', error);
    return NextResponse.json(
      { error: 'Failed to update tier limits' },
      { status: 500 }
    );
  }
}

// POST - Reset tier limits to defaults
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier) {
      return NextResponse.json(
        { error: 'Tier is required' },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Get default limits for the tier
    const { getDefaultTierLimits } = await import('@/lib/dynamic-tier-limits');
    const defaultLimits = getDefaultTierLimits(tier);

    // Update to default limits
    await updateTierLimits(tier, defaultLimits);

    return NextResponse.json({
      success: true,
      message: `Tier limits reset to defaults for ${tier}`,
      tier,
      limits: defaultLimits
    });
  } catch (error) {
    console.error('Failed to reset tier limits:', error);
    return NextResponse.json(
      { error: 'Failed to reset tier limits' },
      { status: 500 }
    );
  }
}
