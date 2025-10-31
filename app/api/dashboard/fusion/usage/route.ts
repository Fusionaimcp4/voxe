import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FusionSubAccountService } from '@/lib/fusion-sub-accounts';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Use the session user ID if no userId provided, or if userId matches session user
    const targetUserId = userId && userId === session.user.id ? userId : session.user.id;

    console.log(`🔍 Fetching usage for user: ${targetUserId} (session: ${session.user.id})`);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { 
        id: true, 
        email: true, 
        fusionSubAccountId: true,
        role: true 
      }
    });

    if (!user) {
      console.log(`❌ User not found: ${targetUserId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`✅ User found: ${user.email}, Fusion ID: ${user.fusionSubAccountId}`);

    if (!user.fusionSubAccountId) {
      console.log('⚠️ No Fusion sub-account ID found, returning empty data');
      return NextResponse.json({
        user: { id: user.id, email: user.email, display_name: user.email },
        metrics: { spend: 0, tokens: 0, requests: 0 },
        activity: [],
        pagination: { currentPage: 1, totalPages: 1, totalLogs: 0, limit: 20 }
      });
    }

    // Get usage metrics from Fusion
    console.log(`📊 Fetching Fusion usage data for ID: ${user.fusionSubAccountId}`);
    const usageData = await FusionSubAccountService.getUsageMetrics(parseInt(user.fusionSubAccountId));
    console.log(`✅ Fusion data retrieved: ${usageData.metrics.requests} requests, $${usageData.metrics.spend} spend`);

    return NextResponse.json(usageData);

  } catch (error) {
    console.error('Failed to fetch Fusion usage data:', error);
    
    // Return empty data instead of error to prevent UI crashes
    return NextResponse.json({
      user: { id: 'unknown', email: 'unknown', display_name: 'Unknown User' },
      metrics: { spend: 0, tokens: 0, requests: 0 },
      activity: [],
      pagination: { currentPage: 1, totalPages: 1, totalLogs: 0, limit: 20 }
    }, { status: 200 });
  }
}
