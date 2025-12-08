import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserGoogleCalendarConfig, decryptCalendarConfiguration } from '@/lib/integrations/calendar-service';
import { CalendarConfigurationGoogle } from '@/lib/integrations/types';

/**
 * GET /api/dashboard/integrations/calendar/google/connect
 * Initiate Google OAuth flow for Calendar integration
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

    // Check for user-provided credentials first, then fall back to system credentials
    let clientId: string | undefined;
    let clientSecret: string | undefined;

    const userConfig = await getUserGoogleCalendarConfig(userId);
    if (userConfig?.oauthClientId && userConfig?.oauthClientSecret) {
      // User has provided their own credentials
      const decryptedConfig = decryptCalendarConfiguration(userConfig) as CalendarConfigurationGoogle;
      clientId = decryptedConfig.oauthClientId;
      clientSecret = decryptedConfig.oauthClientSecret;
    } else {
      // Use system credentials
      clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google Calendar OAuth not configured. Please provide your OAuth credentials in the calendar settings.' },
        { status: 500 }
      );
    }

    // Get base URL from request (works with localhost, ngrok, or production)
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const redirectUri = `${baseUrl}/api/dashboard/integrations/calendar/google/callback`;

    // Encode user ID in state for security
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');

    // Google OAuth scopes
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    // Build authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    // Redirect to Google
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('Error initiating Google Calendar OAuth:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate Google Calendar connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

