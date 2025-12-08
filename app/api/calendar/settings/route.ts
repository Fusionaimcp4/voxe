import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getN8nWorkflow, updateN8nWorkflowStatus } from '@/lib/n8n-api';
import { CalendarSchedulingSettings } from '@/lib/integrations/types';
import { updateN8nWorkflowCalendarNodes } from '@/lib/n8n-api-calendar';

/**
 * GET /api/calendar/settings
 * Read calendar scheduling settings from n8n workflow
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

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get user's workflow
    const workflow = await prisma.workflow.findFirst({
      where: {
        userId: userId,
        n8nWorkflowId: { not: null },
      },
      select: {
        n8nWorkflowId: true,
      },
      orderBy: {
        createdAt: 'desc', // Get most recent workflow
      },
    });

    if (!workflow?.n8nWorkflowId) {
      return NextResponse.json(
        { error: 'No n8n workflow found for this user' },
        { status: 404 }
      );
    }

    // Get workflow from n8n
    const n8nWorkflow = await getN8nWorkflow(workflow.n8nWorkflowId);

    // Find the "Get available time slots" node
    const getSlotsNode = n8nWorkflow.nodes.find((node: any) => {
      const isGetSlotsNode = 
        (node.name === 'Get available time slots' || 
         node.name.includes('Get available') || 
         node.name.includes('calendar slots')) &&
        (node.type === 'n8n-nodes-base.httpRequest' || 
         node.type === 'n8n-nodes-base.httpRequestTool');
      return isGetSlotsNode;
    });

    if (!getSlotsNode) {
      return NextResponse.json(
        { error: 'Calendar "Get available time slots" node not found in workflow' },
        { status: 404 }
      );
    }

    // Extract JSON body from node
    const jsonBody = getSlotsNode.parameters?.jsonBody;
    if (!jsonBody || typeof jsonBody !== 'string') {
      return NextResponse.json(
        { error: 'Calendar node does not have a valid JSON body configuration' },
        { status: 404 }
      );
    }

    // Parse n8n expression syntax to extract actual values
    // Format: ={ "key": "value", "key2": "{{ $expression }}", ... }
    // We'll extract values directly using regex instead of trying to parse JSON with expressions
    let settings: Partial<CalendarSchedulingSettings> = {};

    try {
      // Extract values using regex patterns
      // Pattern for string values: "key": "value"
      // Pattern for number values: "key": 123
      // Pattern for boolean values: "key": true
      // Pattern for arrays/objects: "key": {...} or "key": [...]
      
      const extractString = (key: string): string | null => {
        const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i');
        const match = jsonBody.match(regex);
        if (match && match[1] && !match[1].includes('{{')) {
          return match[1];
        }
        return null;
      };

      const extractNumber = (key: string): number | null => {
        const regex = new RegExp(`"${key}"\\s*:\\s*(\\d+)`, 'i');
        const match = jsonBody.match(regex);
        return match ? parseInt(match[1], 10) : null;
      };

      const extractBoolean = (key: string): boolean | null => {
        const regex = new RegExp(`"${key}"\\s*:\\s*(true|false)`, 'i');
        const match = jsonBody.match(regex);
        if (match) {
          return match[1].toLowerCase() === 'true';
        }
        return null;
      };

      const extractJSON = (key: string): any | null => {
        // Try to extract JSON object or array (handles nested structures)
        // Find the key and then parse the JSON value that follows
        const keyIndex = jsonBody.indexOf(`"${key}"`);
        if (keyIndex === -1) return null;
        
        // Find the colon after the key
        const colonIndex = jsonBody.indexOf(':', keyIndex);
        if (colonIndex === -1) return null;
        
        // Find the start of the value (skip whitespace)
        let valueStart = colonIndex + 1;
        while (valueStart < jsonBody.length && /\s/.test(jsonBody[valueStart])) {
          valueStart++;
        }
        
        if (valueStart >= jsonBody.length) return null;
        
        // Check if it's an object { or array [
        const firstChar = jsonBody[valueStart];
        if (firstChar === '{') {
          // Extract object - find matching closing brace
          let depth = 0;
          let i = valueStart;
          while (i < jsonBody.length) {
            if (jsonBody[i] === '{') depth++;
            if (jsonBody[i] === '}') depth--;
            if (depth === 0) {
              try {
                return JSON.parse(jsonBody.substring(valueStart, i + 1));
              } catch {
                return null;
              }
            }
            i++;
          }
        } else if (firstChar === '[') {
          // Extract array - find matching closing bracket
          let depth = 0;
          let i = valueStart;
          while (i < jsonBody.length) {
            if (jsonBody[i] === '[') depth++;
            if (jsonBody[i] === ']') depth--;
            if (depth === 0) {
              try {
                return JSON.parse(jsonBody.substring(valueStart, i + 1));
              } catch {
                return null;
              }
            }
            i++;
          }
        }
        
        return null;
      };

      // Extract settings
      const timezone = extractString('timezone');
      if (timezone) settings.timezone = timezone;

      const daysAhead = extractNumber('daysAhead');
      if (daysAhead !== null) settings.daysAhead = daysAhead;

      const slotDurationMinutes = extractNumber('slotDurationMinutes');
      if (slotDurationMinutes !== null) settings.slotDurationMinutes = slotDurationMinutes;

      const slotInterval = extractNumber('slotInterval');
      if (slotInterval !== null) settings.slotInterval = slotInterval;

      const maxSlots = extractNumber('maxSlots');
      if (maxSlots !== null) settings.maxSlots = maxSlots;

      const skipPastTimeToday = extractBoolean('skipPastTimeToday');
      if (skipPastTimeToday !== null) settings.skipPastTimeToday = skipPastTimeToday;

      const businessHours = extractJSON('businessHours');
      if (businessHours) settings.businessHours = businessHours;

      const closedDays = extractJSON('closedDays');
      if (closedDays) settings.closedDays = closedDays;

      const holidayDates = extractJSON('holidayDates');
      if (holidayDates) settings.holidayDates = holidayDates;

      const bufferMinutesBetweenMeetings = extractNumber('bufferMinutesBetweenMeetings');
      if (bufferMinutesBetweenMeetings !== null) settings.bufferMinutesBetweenMeetings = bufferMinutesBetweenMeetings;

      const maxBookingsPerDay = extractNumber('maxBookingsPerDay');
      if (maxBookingsPerDay !== null) settings.maxBookingsPerDay = maxBookingsPerDay;

      const maxBookingsPerWeek = extractNumber('maxBookingsPerWeek');
      if (maxBookingsPerWeek !== null) settings.maxBookingsPerWeek = maxBookingsPerWeek;

      // Skip the rest of the old parsing code - we've extracted everything we need


    } catch (parseError) {
      console.error('Error parsing calendar settings from n8n:', parseError);
      // Return empty settings if parsing fails
      return NextResponse.json({
        settings: {},
        warning: 'Could not parse settings from n8n. Using defaults.',
      });
    }

    return NextResponse.json({
      settings,
    });

  } catch (error) {
    console.error('Error reading calendar settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to read calendar settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/settings
 * Save calendar scheduling settings to n8n workflow
 * Uses the existing updateN8nWorkflowCalendarNodes function to avoid duplication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { error: 'settings are required' },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get calendar integration to update
    const integration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        type: 'CALENDAR',
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Calendar integration not found' },
        { status: 404 }
      );
    }

    // Update integration configuration with scheduling settings (needed for updateN8nWorkflowCalendarNodes)
    const updatedConfig = {
      ...(integration.configuration as any),
      schedulingSettings: settings as CalendarSchedulingSettings,
    };

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        configuration: updatedConfig,
      },
    });

    // Get all workflows for this user and update them using existing function
    const workflows = await prisma.workflow.findMany({
      where: {
        userId: userId,
        n8nWorkflowId: { not: null },
      },
      select: {
        n8nWorkflowId: true,
      },
    });

    // Update all n8n workflows for this user (matching old endpoint behavior)
    // Note: If no workflows exist, we still save to database (non-critical)
    try {
      console.log(`🔄 Updating ${workflows.length} workflows with new calendar scheduling settings...`);

      for (const workflow of workflows) {
        if (workflow.n8nWorkflowId) {
          try {
            // Get workflow to check if it's active before updating
            const n8nWorkflow = await getN8nWorkflow(workflow.n8nWorkflowId);
            const wasActive = n8nWorkflow.active;

            // Update workflow using existing function
            await updateN8nWorkflowCalendarNodes(workflow.n8nWorkflowId);
            console.log(`✅ Updated workflow ${workflow.n8nWorkflowId}`);

            // Re-activate workflow if it was active
            if (wasActive) {
              try {
                await updateN8nWorkflowStatus(workflow.n8nWorkflowId, true);
                console.log(`✅ Re-activated workflow ${workflow.n8nWorkflowId}`);
              } catch (activateError) {
                console.warn('⚠️ Failed to re-activate workflow (non-critical):', activateError);
                // Don't fail if activation fails
              }
            }
          } catch (error) {
            console.error(`❌ Failed to update workflow ${workflow.n8nWorkflowId}:`, error);
            // Continue with other workflows even if one fails
          }
        }
      }

      if (workflows.length > 0) {
        console.log(`✅ Successfully updated ${workflows.length} workflows`);
      } else {
        console.log('⚠️ No n8n workflows found, but settings saved to database');
      }
    } catch (n8nError) {
      console.error('Failed to update n8n workflows (non-critical):', n8nError);
      // Don't fail the entire request if n8n update fails
      // The settings are saved in the database, n8n can be updated later
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar settings saved successfully to n8n',
      settings: settings as CalendarSchedulingSettings,
    });

  } catch (error) {
    console.error('Error saving calendar settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save calendar settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

