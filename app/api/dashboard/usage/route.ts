import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserUsageStats } from '@/lib/usage-tracking';

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
    
    return NextResponse.json({
      usage,
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
