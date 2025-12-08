import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserGoogleCalendarConfig, decryptCalendarConfiguration, getValidAccessToken, googleCalendarRequest } from '@/lib/integrations/calendar-service';
import { CalendarConfigurationGoogle } from '@/lib/integrations/types';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addDays, startOfDay, addMinutes, isSameDay, setHours, setMinutes, isBefore, isAfter, addWeeks, startOfWeek } from 'date-fns';

/**
 * OPTIONS /api/internal/calendar/get-slots
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
 * GET /api/internal/calendar/get-slots
 * Return helpful error message (this endpoint only accepts POST)
 */
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests. Please use POST method with JSON body.' },
    { status: 405 }
  );
}

/**
 * POST /api/internal/calendar/get-slots
 * Get available calendar slots for booking (internal API for n8n)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      workflowId, 
      timezone,
      daysAhead = 7, 
      slotDurationMinutes = 30,
      slotInterval = 30,
      maxSlots = 5,
      skipPastTimeToday = true,
      businessHours,
      closedDays,
      holidayDates = [],
      bufferMinutesBetweenMeetings = 15,
      maxBookingsPerDay,
      maxBookingsPerWeek,
      apiKey 
    } = body;

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

    // Use timezone from config or request, default to UTC
    const tz = timezone || config.timezone || 'UTC';

    // Get calendar ID with fallback to 'primary'
    const calendarId = config.calendarId || 'primary';

    // Get current time in UTC and convert to target timezone
    const nowUtc = new Date();
    const nowInTz = toZonedTime(nowUtc, tz);
    
    // Calculate end date in timezone
    const endDateInTz = addDays(nowInTz, daysAhead);

    // Query free/busy information (Google Calendar returns times in UTC)
    const freeBusyResponse = await googleCalendarRequest(
      '/freeBusy',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          timeMin: nowUtc.toISOString(),
          timeMax: fromZonedTime(endDateInTz, tz).toISOString(),
          items: [{ id: calendarId }],
        }),
      }
    );

    const busyPeriods = freeBusyResponse.calendars[calendarId]?.busy || [];

    // Get existing events for booking limit checks
    let existingEvents: Array<{ start: string; end: string }> = [];
    if (maxBookingsPerDay || maxBookingsPerWeek) {
      try {
        const timeMax = fromZonedTime(endDateInTz, tz).toISOString();
        const params = new URLSearchParams({
          timeMin: nowUtc.toISOString(),
          timeMax: timeMax,
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '2500', // Google Calendar API limit
        });
        
        const eventsResponse = await googleCalendarRequest(
          `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
          accessToken,
          {
            method: 'GET',
          }
        );
        existingEvents = (eventsResponse.items || []).map((event: any) => ({
          start: event.start?.dateTime || event.start?.date || '',
          end: event.end?.dateTime || event.end?.date || '',
        }));
      } catch (error) {
        console.warn('Failed to fetch existing events for booking limits:', error);
      }
    }

    // Normalize business hours - default to Mon-Fri 9-5 if not provided
    const defaultBusinessHours = {
      mon: ['09:00', '17:00'],
      tue: ['09:00', '17:00'],
      wed: ['09:00', '17:00'],
      thu: ['09:00', '17:00'],
      fri: ['09:00', '17:00'],
    };
    const normalizedBusinessHours = businessHours || defaultBusinessHours;

    // Normalize closed days - default to weekends if not provided
    const normalizedClosedDays = closedDays || ['sat', 'sun'];

    // Normalize holiday dates - parse ISO date strings
    const normalizedHolidayDates = (holidayDates || []).map((date: string) => {
      // Parse YYYY-MM-DD format
      const parts = date.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(date);
    });

    // Helper: Get day of week abbreviation (mon, tue, wed, etc.)
    const getDayOfWeek = (date: Date): string => {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      return days[date.getDay()];
    };

    // Helper: Check if date is a holiday
    const isHoliday = (date: Date): boolean => {
      return normalizedHolidayDates.some((holiday: Date) => {
        return isSameDay(date, holiday);
      });
    };

    // Helper: Check if day is closed
    const isClosedDay = (date: Date): boolean => {
      const dayOfWeek = getDayOfWeek(date);
      return normalizedClosedDays.includes(dayOfWeek);
    };

    // Helper: Get business hours for a specific day
    const getBusinessHoursForDay = (date: Date): [string, string] | null => {
      const dayOfWeek = getDayOfWeek(date);
      const hours = normalizedBusinessHours[dayOfWeek as keyof typeof normalizedBusinessHours];
      return hours || null;
    };

    // Helper: Parse time string (HH:MM) and set it on a date
    const setTimeOnDate = (date: Date, timeStr: string): Date => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return setMinutes(setHours(date, hours), minutes);
    };

    // Helper: Check if slot overlaps with busy period (with buffer)
    const isSlotBusy = (slotStart: Date, slotEnd: Date): boolean => {
      // Convert slot times to UTC for comparison with Google Calendar busy periods
      const slotStartUtc = fromZonedTime(slotStart, tz);
      const slotEndUtc = fromZonedTime(slotEnd, tz);

      return busyPeriods.some((busy: { start: string; end: string }) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        
        // Add buffer after busy period
        const busyEndWithBuffer = addMinutes(busyEnd, bufferMinutesBetweenMeetings);
        
        // Check if slot overlaps with busy period (including buffer)
        return (slotStartUtc < busyEndWithBuffer && slotEndUtc > busyStart);
      });
    };

    // Helper: Count bookings for a specific day
    const countBookingsForDay = (date: Date): number => {
      const dayStart = startOfDay(date);
      const dayEnd = addDays(dayStart, 1);
      const dayStartUtc = fromZonedTime(dayStart, tz);
      const dayEndUtc = fromZonedTime(dayEnd, tz);

      return existingEvents.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= dayStartUtc && eventStart < dayEndUtc;
      }).length;
    };

    // Helper: Count bookings for a specific week
    const countBookingsForWeek = (date: Date): number => {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      const weekEnd = addWeeks(weekStart, 1);
      const weekStartUtc = fromZonedTime(weekStart, tz);
      const weekEndUtc = fromZonedTime(weekEnd, tz);

      return existingEvents.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= weekStartUtc && eventStart < weekEndUtc;
      }).length;
    };

    // Generate slots with all constraints enforced
    const slots: Array<{ start: string; end: string }> = [];
    const slotDurationMs = slotDurationMinutes * 60 * 1000;
    const slotIntervalMs = slotInterval * 60 * 1000;

    // Iterate day by day
    let currentDate = startOfDay(nowInTz);
    const endDate = startOfDay(endDateInTz);

    while (slots.length < maxSlots && currentDate <= endDate) {
      // Skip closed days
      if (isClosedDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Skip holidays
      if (isHoliday(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      // Get business hours for this day
      const businessHoursForDay = getBusinessHoursForDay(currentDate);
      if (!businessHoursForDay) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      const [startTimeStr, endTimeStr] = businessHoursForDay;
      const dayStart = setTimeOnDate(currentDate, startTimeStr);
      const dayEnd = setTimeOnDate(currentDate, endTimeStr);

      // For today, start from current time (or next interval) if skipPastTimeToday is true
      let slotStart = dayStart;
      if (isSameDay(currentDate, nowInTz) && skipPastTimeToday) {
        // Round up to next slot interval
        const minutesFromStart = Math.ceil((nowInTz.getTime() - dayStart.getTime()) / slotIntervalMs) * slotIntervalMs;
        slotStart = addMinutes(dayStart, minutesFromStart);
        
        // Ensure we don't start too close to now (at least one interval away)
        if (isBefore(slotStart, addMinutes(nowInTz, slotInterval))) {
          slotStart = addMinutes(slotStart, slotInterval);
        }

        // Don't generate slots if we're past business hours
        if (isAfter(slotStart, dayEnd) || isAfter(addMinutes(slotStart, slotDurationMinutes), dayEnd)) {
          currentDate = addDays(currentDate, 1);
          continue;
        }
      }

      // Check booking limits for this day
      if (maxBookingsPerDay) {
        const dayBookings = countBookingsForDay(currentDate);
        if (dayBookings >= maxBookingsPerDay) {
          currentDate = addDays(currentDate, 1);
          continue;
        }
      }

      // Check booking limits for this week
      if (maxBookingsPerWeek) {
        const weekBookings = countBookingsForWeek(currentDate);
        if (weekBookings >= maxBookingsPerWeek) {
          currentDate = addDays(currentDate, 1);
          continue;
        }
      }

      // Generate slots for this day within business hours
      while (slots.length < maxSlots && slotStart < dayEnd) {
        const slotEnd = addMinutes(slotStart, slotDurationMinutes);

        // Don't exceed business hours
        if (isAfter(slotEnd, dayEnd)) {
          break;
        }

        // Check if slot is busy (including buffer)
        if (!isSlotBusy(slotStart, slotEnd)) {
          // Convert to UTC for response
          const slotStartUtc = fromZonedTime(slotStart, tz);
          const slotEndUtc = fromZonedTime(slotEnd, tz);

          slots.push({
            start: slotStartUtc.toISOString(),
            end: slotEndUtc.toISOString(),
          });
        }

        // Move to next slot interval
        slotStart = addMinutes(slotStart, slotInterval);
      }

      // Move to next day
      currentDate = addDays(currentDate, 1);
    }

    return NextResponse.json({
      slots,
    });

  } catch (error) {
    console.error('Error getting calendar slots:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get calendar slots',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

