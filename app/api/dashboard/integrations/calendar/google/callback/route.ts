import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/integrations/encryption';
import { getUserGoogleCalendarConfig, decryptCalendarConfiguration, getGoogleUserInfo, getPrimaryCalendarId } from '@/lib/integrations/calendar-service';
import { CalendarConfigurationGoogle } from '@/lib/integrations/types';

/**
 * GET /api/dashboard/integrations/calendar/google/callback
 * Handle Google OAuth callback and create/update calendar integration
 */
export async function GET(request: NextRequest) {
  // Get base URL from request (works with localhost, ngrok, or production)
  const requestUrl = new URL(request.url);
  const localBaseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=missing_code_or_state`
      );
    }

    // Decode state to get userId
    let userId: string;
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString());
      userId = decodedState.userId;
    } catch (e) {
      console.error('Invalid state parameter:', e);
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=invalid_state`
      );
    }

    // Verify session matches state
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=unauthorized`
      );
    }

    // Use request origin for redirect URI (works with localhost, ngrok, or production)
    const redirectUri = `${localBaseUrl}/api/dashboard/integrations/calendar/google/callback`;

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
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=oauth_not_configured`
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token || !refresh_token) {
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=missing_tokens`
      );
    }

    // Check prisma is available
    if (!prisma) {
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=database_error`
      );
    }

    // Get user's email from database as fallback
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    const userEmail = user?.email || 'unknown@example.com';

    // Get user info and calendar details
    // Note: We can still create the credential even if calendar API calls fail
    // The credential will be created with the OAuth tokens we have
    let userInfo: { email: string; timezone: string };
    let calendarId: string;
    let calendarApiError = false;
    
    try {
      userInfo = await getGoogleUserInfo(access_token);
      calendarId = await getPrimaryCalendarId(access_token);
    } catch (apiError: any) {
      // Handle Google Calendar API not enabled error
      if (apiError?.message?.includes('403') || apiError?.message?.includes('PERMISSION_DENIED') || apiError?.message?.includes('SERVICE_DISABLED')) {
        console.error('Google Calendar API not enabled:', apiError.message);
        calendarApiError = true;
        // Still continue - we can create credential with just email from OAuth
        // Try to get email from token if possible, otherwise use user's email from database
        try {
          // Decode JWT token to get email (fallback)
          const tokenParts = access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            userInfo = {
              email: payload.email || userEmail, // Use user's email from database as fallback
              timezone: 'UTC'
            };
            calendarId = 'primary'; // Default calendar ID
          } else {
            throw new Error('Invalid token format');
          }
        } catch (e) {
          // If we can't decode, use user's email from database
          userInfo = {
            email: userEmail, // Use user's email from database
            timezone: 'UTC'
          };
          calendarId = 'primary';
        }
      } else {
        throw apiError; // Re-throw if it's a different error
      }
    }

    // Calculate expiry date
    const expiryDate = Date.now() + (expires_in * 1000);

    // Encrypt tokens
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = encrypt(refresh_token);

    // Check prisma is available
    if (!prisma) {
      return NextResponse.redirect(
        `${localBaseUrl}/dashboard/integrations?calendar_error=database_error`
      );
    }

    // Get existing integration to preserve OAuth credentials
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId,
        type: 'CALENDAR',
      },
    });

    const existingConfig = existingIntegration 
      ? (existingIntegration.configuration as any) as CalendarConfigurationGoogle
      : null;

    // Note: We don't create n8n credentials for Google Calendar
    // Instead, n8n workflows should call Voxe's internal APIs:
    // - POST /api/internal/calendar/get-slots - Get available time slots
    // - POST /api/internal/calendar/book-event - Book a calendar event
    // These APIs use the OAuth tokens stored in Voxe's Integration table
    // This avoids requiring users to authenticate again in n8n

    // Build configuration, preserving existing OAuth credentials if they exist
    const configuration: CalendarConfigurationGoogle = {
      provider: 'GOOGLE_CALENDAR',
      accountEmail: userInfo.email,
      calendarId: calendarId,
      timezone: userInfo.timezone,
      enabledForChatScheduling: existingConfig?.enabledForChatScheduling ?? true,
      // Preserve OAuth credentials if they exist
      oauthClientId: existingConfig?.oauthClientId,
      oauthClientSecret: existingConfig?.oauthClientSecret,
      tokens: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiryDate: expiryDate,
      },
      connectionStatus: {
        isConnected: true,
        lastChecked: new Date().toISOString(),
      },
      // Note: No n8n credential stored - workflows use Voxe's internal APIs
    };

    // Upsert integration
    if (existingIntegration) {
      // Update existing integration
      await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          name: 'Google Calendar',
          configuration: configuration as any,
          isActive: true,
        },
      });
    } else {
      // Create new integration
      await prisma.integration.create({
        data: {
          userId,
          name: 'Google Calendar',
          type: 'CALENDAR',
          configuration: configuration as any,
          isActive: true,
        },
      });
    }

    // Enable calendar nodes in n8n workflows
    try {
      const { toggleN8nCalendarNodes } = await import('@/lib/n8n-api-calendar');
      await toggleN8nCalendarNodes(userId, false); // false = enable nodes
      console.log('✅ Enabled calendar nodes in n8n workflows');
    } catch (n8nError) {
      console.error('⚠️ Failed to enable calendar nodes in n8n workflows (non-critical):', n8nError);
      // Don't fail the entire OAuth flow if n8n update fails
    }

    // Regenerate system messages to include Calendar section
    // This will update both the database/file AND n8n workflows
    try {
      console.log('🔄 [Calendar OAuth] Regenerating system messages for all user workflows...');
      const { regenerateSystemMessagesForUser } = await import('@/lib/system-message-regenerate');
      await regenerateSystemMessagesForUser(userId);
      console.log('✅ [Calendar OAuth] Regenerated system messages with Calendar section and updated n8n workflows');
    } catch (regenError) {
      console.error('❌ [Calendar OAuth] Failed to regenerate system messages:', regenError);
      console.error('   Error details:', regenError instanceof Error ? regenError.stack : String(regenError));
      // Don't fail the OAuth flow if regeneration fails, but log the error clearly
    }

    // Redirect back to integrations page with success
    return NextResponse.redirect(
      `${localBaseUrl}/dashboard/integrations?calendar_status=connected`
    );

  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      `${localBaseUrl}/dashboard/integrations?calendar_error=${encodeURIComponent(error instanceof Error ? error.message : 'unknown_error')}`
    );
  }
}

