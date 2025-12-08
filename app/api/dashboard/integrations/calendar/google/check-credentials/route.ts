import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserGoogleCalendarConfig } from '@/lib/integrations/calendar-service';

/**
 * GET /api/dashboard/integrations/calendar/google/check-credentials
 * Check if user needs to provide OAuth credentials
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if system has OAuth credentials configured
    const hasSystemCredentials = !!(
      process.env.GOOGLE_CALENDAR_CLIENT_ID && 
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );

    // Check if user has provided their own credentials
    const userConfig = await getUserGoogleCalendarConfig(userId);
    const hasUserCredentials = !!(
      userConfig?.oauthClientId && 
      userConfig?.oauthClientSecret
    );

    // User needs credentials if neither system nor user credentials exist
    const needsCredentials = !hasSystemCredentials && !hasUserCredentials;

    return NextResponse.json({
      needsCredentials,
      hasSystemCredentials,
      hasUserCredentials,
    });

  } catch (error) {
    console.error('Error checking credentials:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

