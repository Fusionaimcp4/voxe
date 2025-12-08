import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserGoogleCalendarConfig, decryptCalendarConfiguration, getValidAccessToken, googleCalendarRequest } from '@/lib/integrations/calendar-service';
import { CalendarConfigurationGoogle } from '@/lib/integrations/types';

/**
 * OPTIONS /api/internal/calendar/book-event
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * GET /api/internal/calendar/book-event
 * Return helpful error message (this endpoint only accepts POST)
 */
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests. Please use POST method with JSON body.' },
    { status: 405 }
  );
}

/**
 * POST /api/internal/calendar/book-event
 * Book a calendar event (internal API for n8n)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, workflowId, slot, title, description, attendees: attendeesInput, addMeetLink, apiKey, start, end } = body;
    
    // Normalize slot - handle both nested format { slot: { start, end } } and flat format { start, end }
    let normalizedSlot: { start: string; end: string } | null = null;
    if (slot && slot.start && slot.end) {
      // Nested format: { slot: { start: "...", end: "..." } }
      normalizedSlot = { start: slot.start, end: slot.end };
    } else if (start && end) {
      // Flat format: { start: "...", end: "..." }
      normalizedSlot = { start, end };
    }
    
    // Normalize attendees - handle string, array, JSON string, or undefined
    let normalizedAttendees: string[] = [];
    if (Array.isArray(attendeesInput)) {
      normalizedAttendees = attendeesInput;
    } else if (typeof attendeesInput === "string") {
      try {
        const parsed = JSON.parse(attendeesInput);
        if (Array.isArray(parsed)) {
          normalizedAttendees = parsed;
        } else {
          normalizedAttendees = [attendeesInput];
        }
      } catch {
        normalizedAttendees = [attendeesInput];
      }
    } else {
      normalizedAttendees = [];
    }
    
    // Normalize addMeetLink - handle boolean, string "true"/"false", or undefined
    let addMeetLinkBool = false;
    if (typeof addMeetLink === "boolean") {
      addMeetLinkBool = addMeetLink;
    } else if (typeof addMeetLink === "string") {
      addMeetLinkBool = addMeetLink.toLowerCase() === "true";
    }
    
    // Debug logging before validation
    console.log("[Book Event] Normalized input:", {
      workflowId,
      slot: normalizedSlot,
      title,
      description,
      attendees: normalizedAttendees,
      addMeetLink: addMeetLinkBool,
    });
    
    // Authenticate: either via session (for direct calls) or workflowId (for n8n, like RAG API)
    let userId: string | null = null;

    // Try session authentication first
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      // Verify tenant matches session if provided
      if (tenantId && tenantId !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: Tenant ID does not match session' },
          { status: 403 }
        );
      }
    } else {
      // For n8n calls, use workflowId to look up userId (same pattern as RAG API)
      // API key is optional - only validate if INTERNAL_API_KEY is set
      if (process.env.INTERNAL_API_KEY || process.env.N8N_API_KEY) {
        const expectedApiKey = process.env.INTERNAL_API_KEY || process.env.N8N_API_KEY;
        if (apiKey && apiKey !== expectedApiKey) {
          return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          );
        }
      }

      // Look up userId from workflowId (same as RAG API)
      if (workflowId) {
        if (!prisma) {
          return NextResponse.json(
            { error: 'Database not available' },
            { status: 503 }
          );
        }
        
        const workflow = await prisma.workflow.findFirst({
          where: {
            OR: [
              { id: workflowId },
              { n8nWorkflowId: workflowId }
            ]
          },
          select: { userId: true }
        });

        if (!workflow) {
          return NextResponse.json(
            { error: 'Workflow not found' },
            { status: 404 }
          );
        }

        userId = workflow.userId;
      } else if (tenantId) {
        userId = tenantId;
      } else {
        return NextResponse.json(
          { error: 'workflowId or tenantId is required' },
          { status: 400 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!normalizedSlot || !normalizedSlot.start || !normalizedSlot.end) {
      return NextResponse.json(
        { error: 'Invalid slot: start and end are required. Provide either { slot: { start, end } } or { start, end } in the request body.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate and normalize date format
    // Handle both ISO strings and Date objects from n8n
    let startDate: Date;
    let endDate: Date;
    
    try {
      // normalizedSlot.start and normalizedSlot.end are strings, convert to Date
      startDate = typeof normalizedSlot.start === 'string' ? new Date(normalizedSlot.start) : new Date(String(normalizedSlot.start));
      endDate = typeof normalizedSlot.end === 'string' ? new Date(normalizedSlot.end) : new Date(String(normalizedSlot.end));
    } catch (e) {
      return NextResponse.json(
        { 
          error: 'Invalid date format: start and end must be valid ISO 8601 dates',
          received: { start: normalizedSlot.start, end: normalizedSlot.end }
        },
        { status: 400 }
      );
    }
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { 
          error: 'Invalid date format: start and end must be valid ISO 8601 dates',
          received: { start: normalizedSlot.start, end: normalizedSlot.end }
        },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { 
          error: 'Invalid slot: end time must be after start time',
          received: { start: normalizedSlot.start, end: normalizedSlot.end }
        },
        { status: 400 }
      );
    }

    // Normalize to ISO strings for Google Calendar API
    const finalSlot = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };

    // Get calendar configuration
    const config = await getUserGoogleCalendarConfig(userId);
    if (!config) {
      return NextResponse.json(
        { error: 'Calendar integration not found or not connected' },
        { status: 404 }
      );
    }

    // Get OAuth credentials (user-provided or system)
    let clientId: string | undefined;
    let clientSecret: string | undefined;

    if (config.oauthClientId && config.oauthClientSecret) {
      // User has provided their own credentials
      const decryptedConfig = decryptCalendarConfiguration(config) as CalendarConfigurationGoogle;
      clientId = decryptedConfig.oauthClientId;
      clientSecret = decryptedConfig.oauthClientSecret;
    } else {
      // Use system credentials
      clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google Calendar OAuth not configured' },
        { status: 500 }
      );
    }

    const accessToken = await getValidAccessToken(config, userId, clientId, clientSecret);

    // Get calendar ID with fallback to 'primary'
    const calendarId = config.calendarId || 'primary';

    // Build event object using normalized dates
    const event: any = {
      summary: title,
      description: description || 'Booked from Voxe',
      start: {
        dateTime: finalSlot.start,
        timeZone: config.timezone || 'UTC',
      },
      end: {
        dateTime: finalSlot.end,
        timeZone: config.timezone || 'UTC',
      },
    };

    // Add attendees if provided (convert normalizedAttendees to Google Calendar format)
    if (normalizedAttendees.length > 0) {
      event.attendees = normalizedAttendees
        .filter((email: any) => email && typeof email === 'string' && email.trim())
        .map((email: string) => ({
          email: email.trim(),
          displayName: email.trim(),
        }));
    }

    // Add Google Meet link if requested
    if (addMeetLinkBool) {
      event.conferenceData = {
        createRequest: {
          requestId: `voxe-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    // Log event structure for debugging
    console.log('Creating calendar event:', {
      calendarId: calendarId,
      summary: event.summary,
      start: event.start,
      end: event.end,
      attendeesCount: event.attendees?.length || 0,
      hasMeetLink: !!event.conferenceData,
      sendUpdates: 'all'
    });

    // Create event with sendUpdates=all to email attendees
    const createdEvent = await googleCalendarRequest(
      `/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(event),
      }
    );

    return NextResponse.json({
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink,
      start: createdEvent.start.dateTime || createdEvent.start.date,
      end: createdEvent.end.dateTime || createdEvent.end.date,
      meetLink: createdEvent.hangoutLink || null,
    });

  } catch (error) {
    console.error('Error booking calendar event:', error);
    
    // Determine status code based on error type
    let statusCode = 500;
    let errorMessage = 'Failed to book calendar event';
    
    if (error instanceof Error) {
      // Check if it's a validation error (400)
      if (error.message.includes('Invalid') || error.message.includes('required')) {
        statusCode = 400;
      }
      // Check if it's a Google API error
      if (error.message.includes('Google Calendar API')) {
        statusCode = 502; // Bad Gateway - external API error
      }
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        // Add helpful message for AI agent
        suggestion: statusCode === 400 
          ? 'Please check that the slot dates are valid ISO 8601 format (e.g., "2025-01-15T14:00:00Z") and the end time is after the start time.'
          : 'Calendar booking failed. Please try again or contact support if the issue persists.'
      },
      { status: statusCode }
    );
  }
}

