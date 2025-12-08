import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserGoogleCalendarConfig } from '@/lib/integrations/calendar-service';
import { CalendarConfigurationGoogle } from '@/lib/integrations/types';

/**
 * GET /api/dashboard/integrations/calendar
 * Get current user's calendar integration status
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

    // Find calendar integration
    const config = await getUserGoogleCalendarConfig(userId);

    if (!config) {
      return NextResponse.json({
        connected: false,
      });
    }

    // Return safe summary (no decrypted tokens)
    return NextResponse.json({
      connected: true,
      provider: config.provider,
      accountEmail: config.accountEmail,
      calendarId: config.calendarId,
      timezone: config.timezone,
      enabledForChatScheduling: config.enabledForChatScheduling || false,
      connectionStatus: config.connectionStatus || {
        isConnected: true,
        lastChecked: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error fetching calendar integration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

