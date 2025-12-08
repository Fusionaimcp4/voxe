/**
 * Calendar integration service for Google Calendar and other providers
 * Handles OAuth token management, API calls, and calendar operations
 */

import { prisma } from '@/lib/prisma';
import { CalendarConfigurationGoogle, CalendarConfiguration } from './types';
import { encrypt, decrypt } from './encryption';

/**
 * Get user's Google Calendar configuration
 */
export async function getUserGoogleCalendarConfig(
  userId: string
): Promise<CalendarConfigurationGoogle | null> {
  try {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        type: 'CALENDAR',
        isActive: true,
      },
    });

    if (!integration) {
      return null;
    }

    const config = integration.configuration as any;
    if (config.provider !== 'GOOGLE_CALENDAR') {
      return null;
    }

    return config as CalendarConfigurationGoogle;
  } catch (error) {
    console.error('Error fetching Google Calendar config:', error);
    return null;
  }
}

/**
 * Decrypt calendar configuration tokens and OAuth credentials
 */
export function decryptCalendarConfiguration(
  config: CalendarConfiguration
): CalendarConfiguration {
  const decryptedConfig = { ...config } as CalendarConfigurationGoogle;

  if (config.provider === 'GOOGLE_CALENDAR') {
    const googleConfig = config as CalendarConfigurationGoogle;
    
    // Decrypt OAuth credentials if present
    if (googleConfig.oauthClientId && googleConfig.oauthClientId.includes(':')) {
      decryptedConfig.oauthClientId = decrypt(googleConfig.oauthClientId);
    }
    
    if (googleConfig.oauthClientSecret && googleConfig.oauthClientSecret.includes(':')) {
      decryptedConfig.oauthClientSecret = decrypt(googleConfig.oauthClientSecret);
    }
    
    // Decrypt access token
    if (googleConfig.tokens?.accessToken && googleConfig.tokens.accessToken.includes(':')) {
      if (!decryptedConfig.tokens) {
        decryptedConfig.tokens = { ...googleConfig.tokens };
      }
      decryptedConfig.tokens.accessToken = decrypt(googleConfig.tokens.accessToken);
    }
    
    // Decrypt refresh token
    if (googleConfig.tokens?.refreshToken && googleConfig.tokens.refreshToken.includes(':')) {
      if (!decryptedConfig.tokens) {
        decryptedConfig.tokens = { ...googleConfig.tokens };
      }
      decryptedConfig.tokens.refreshToken = decrypt(googleConfig.tokens.refreshToken);
    }
  }

  return decryptedConfig;
}

/**
 * Refresh Google OAuth access token using refresh token
 */
export async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiryDate: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} ${error}`);
  }

  const data = await response.json();
  const expiryDate = Date.now() + (data.expires_in * 1000);

  return {
    accessToken: data.access_token,
    expiryDate,
  };
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(
  config: CalendarConfigurationGoogle,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const decryptedConfig = decryptCalendarConfiguration(config) as CalendarConfigurationGoogle;
  
  if (!decryptedConfig.tokens) {
    throw new Error('Calendar tokens not found. Please reconnect your calendar.');
  }
  
  const { accessToken, refreshToken, expiryDate } = decryptedConfig.tokens;

  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes

  if (expiryDate && (now + buffer) >= expiryDate) {
    // Token expired or about to expire, refresh it
    const refreshed = await refreshGoogleAccessToken(refreshToken, clientId, clientSecret);
    
    // Update the integration with new token
    if (prisma) {
      const integration = await prisma.integration.findFirst({
        where: {
          userId,
          type: 'CALENDAR',
        },
      });

      if (integration) {
        const updatedConfig = {
          ...config,
          tokens: {
            ...config.tokens,
            accessToken: encrypt(refreshed.accessToken),
            expiryDate: refreshed.expiryDate,
          },
        };

        await prisma.integration.update({
          where: { id: integration.id },
          data: { configuration: updatedConfig },
        });
      }
    }

    return refreshed.accessToken;
  }

  return accessToken;
}

/**
 * Make authenticated Google Calendar API request
 */
export async function googleCalendarRequest(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Google Calendar API error: ${response.status}`;
    
    // Try to parse error JSON for better error messages
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error) {
        const error = errorJson.error;
        errorMessage = error.message || errorMessage;
        
        // Log full error details for debugging
        console.error('Google Calendar API Error Details:', {
          status: response.status,
          message: error.message,
          reason: error.reason,
          errors: error.errors,
          details: error.details
        });
        
        // Provide helpful message for common errors
        if (response.status === 403 && error.reason === 'accessNotConfigured') {
          const activationUrl = error.details?.[0]?.metadata?.activationUrl;
          if (activationUrl) {
            errorMessage = `Google Calendar API is not enabled. Please enable it at: ${activationUrl}`;
          } else {
            errorMessage = 'Google Calendar API is not enabled in your Google Cloud project. Please enable it in the Google Cloud Console.';
          }
        } else if (response.status === 401) {
          errorMessage = 'Invalid or expired Google Calendar access token. Please reconnect your calendar.';
        } else if (response.status === 404) {
          errorMessage = 'Calendar not found. Please check your calendar ID.';
        } else if (response.status === 400) {
          // Bad Request - log the full error for debugging
          const errorDetails = error.errors?.map((e: any) => e.message || e.reason).join('; ') || error.message;
          errorMessage = `Invalid request to Google Calendar API: ${errorDetails}`;
          console.error('Bad Request Details:', JSON.stringify(errorJson, null, 2));
        }
      }
    } catch {
      // If parsing fails, use the raw error text
      errorMessage = `Google Calendar API error: ${response.status} ${errorText}`;
      console.error('Raw error response:', errorText);
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get user's primary email and timezone from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  email: string;
  timezone: string;
}> {
  // Get user info
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch user info');
  }

  const userInfo = await userInfoResponse.json();

  // Get calendar settings for timezone
  const calendarSettingsResponse = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/settings/timezone',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  let timezone = 'UTC';
  if (calendarSettingsResponse.ok) {
    const settings = await calendarSettingsResponse.json();
    timezone = settings.value || 'UTC';
  }

  return {
    email: userInfo.email,
    timezone: timezone,
  };
}

/**
 * Get list of calendars
 */
export async function getGoogleCalendars(accessToken: string): Promise<Array<{
  id: string;
  summary: string;
  primary?: boolean;
}>> {
  const response = await googleCalendarRequest('/users/me/calendarList', accessToken);
  
  return response.items.map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    primary: cal.primary || false,
  }));
}

/**
 * Get primary calendar ID
 */
export async function getPrimaryCalendarId(accessToken: string): Promise<string> {
  const calendars = await getGoogleCalendars(accessToken);
  const primary = calendars.find(cal => cal.primary);
  
  if (primary) {
    return primary.id;
  }

  // Fallback to first calendar or 'primary'
  return calendars[0]?.id || 'primary';
}

