/**
 * n8n Calendar Integration API
 * Functions to configure calendar HTTP Request nodes in n8n workflows
 */

import { getN8nWorkflow, N8nWorkflowResponse } from './n8n-api';
import { prisma } from './prisma';
import { CalendarSchedulingSettings } from '@/lib/integrations/types';

/**
 * Get the base URL for Voxe API (ngrok or localhost)
 */
function getVoxeApiBaseUrl(): string {
  // Try ngrok URL first (for production/testing)
  const ngrokUrl = process.env.NGROK_URL;
  if (ngrokUrl) {
    return ngrokUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get internal API key for n8n to authenticate with Voxe
 */
function getInternalApiKey(): string {
  return process.env.INTERNAL_API_KEY || process.env.N8N_API_KEY || '';
}

/**
 * Update calendar HTTP Request nodes in a workflow
 * Similar to how RAG nodes are configured
 */
export async function updateN8nWorkflowCalendarNodes(
  workflowId: string,
  calendarApiUrl?: string
): Promise<N8nWorkflowResponse> {
  console.log(`🔄 Updating calendar nodes for workflow ${workflowId}...`);

  // Get current workflow
  const workflow = await getN8nWorkflow(workflowId);

  // Get workflow from database to get userId
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  const dbWorkflow = await prisma.workflow.findFirst({
    where: { n8nWorkflowId: workflowId },
    select: { userId: true }
  });

  if (!dbWorkflow) {
    throw new Error(`Workflow ${workflowId} not found in database`);
  }

  const userId = dbWorkflow.userId;
  const apiKey = getInternalApiKey();
  const baseUrl = calendarApiUrl || getVoxeApiBaseUrl();

  // Get calendar integration to retrieve scheduling settings
  let schedulingSettings: any = null;
  try {
    const calendarIntegration = await prisma.integration.findFirst({
      where: {
        userId: userId,
        type: 'CALENDAR',
        isActive: true,
      },
      select: {
        configuration: true,
      },
    });

    if (calendarIntegration?.configuration) {
      const config = calendarIntegration.configuration as any;
      schedulingSettings = config.schedulingSettings || null;
      console.log('📅 Found scheduling settings:', schedulingSettings ? 'Yes' : 'No (using defaults)');
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch calendar integration settings, using defaults:', error);
  }

  // Debug: Log all nodes to find calendar nodes
  console.log('🔍 Available nodes in workflow:');
  workflow.nodes.forEach((node: any, index: number) => {
    console.log(`  ${index + 1}. Name: "${node.name}", Type: "${node.type}"`);
  });

  // Find and update calendar nodes
  const updatedNodes = workflow.nodes.map((node: any) => {
    // Look for calendar-related HTTP Request nodes
    const isGetSlotsNode = 
      (node.name === 'Get available time slots' || 
       node.name.includes('Get available') || 
       node.name.includes('calendar slots')) &&
      (node.type === 'n8n-nodes-base.httpRequest' || 
       node.type === 'n8n-nodes-base.httpRequestTool');

    const isBookEventNode = 
      (node.name === 'Book calendar events' || 
       node.name.includes('Book calendar') || 
       node.name.includes('Book event')) &&
      (node.type === 'n8n-nodes-base.httpRequest' || 
       node.type === 'n8n-nodes-base.httpRequestTool');

    if (isGetSlotsNode) {
      console.log(`✅ Found "Get available time slots" node: "${node.name}" (${node.type})`);
      
      const apiUrl = `${baseUrl}/api/internal/calendar/get-slots`;
      
      // Use scheduling settings from integration, or fall back to defaults
      const timezone = schedulingSettings?.timezone || 'America/Chicago';
      const daysAhead = schedulingSettings?.daysAhead ?? 14;
      const slotDurationMinutes = schedulingSettings?.slotDurationMinutes ?? 30;
      const slotInterval = schedulingSettings?.slotInterval ?? 30;
      const maxSlots = schedulingSettings?.maxSlots ?? 3;
      const skipPastTimeToday = schedulingSettings?.skipPastTimeToday !== undefined ? schedulingSettings.skipPastTimeToday : true;
      const businessHours = schedulingSettings?.businessHours || {
        mon: ['09:00', '17:00'],
        tue: ['09:00', '17:00'],
        wed: ['09:00', '17:00'],
        thu: ['09:00', '17:00'],
        fri: ['09:00', '17:00'],
      };
      const closedDays = schedulingSettings?.closedDays || ['sat', 'sun'];
      const holidayDates = schedulingSettings?.holidayDates || [];
      const bufferMinutesBetweenMeetings = schedulingSettings?.bufferMinutesBetweenMeetings ?? 15;
      const maxBookingsPerDay = schedulingSettings?.maxBookingsPerDay ?? 10;
      const maxBookingsPerWeek = schedulingSettings?.maxBookingsPerWeek ?? 40;
      
      // Create JSON body with n8n expression syntax
      // Use workflowId (n8n will look up userId from it, like RAG API)
      // Note: No apiKey needed - authentication is handled via workflowId lookup
      const jsonBody = `={
  "workflowId": "{{ $workflow.id }}",
  "timezone": "${timezone}",
  "daysAhead": ${daysAhead},
  "slotDurationMinutes": ${slotDurationMinutes},
  "slotInterval": ${slotInterval},
  "maxSlots": ${maxSlots},
  "skipPastTimeToday": ${skipPastTimeToday},
  "businessHours": ${JSON.stringify(businessHours)},
  "closedDays": ${JSON.stringify(closedDays)},
  "holidayDates": ${JSON.stringify(holidayDates)},
  "bufferMinutesBetweenMeetings": ${bufferMinutesBetweenMeetings},
  "maxBookingsPerDay": ${maxBookingsPerDay},
  "maxBookingsPerWeek": ${maxBookingsPerWeek}
}`;

      console.log(`✅ Updating "Get available time slots" node with:`, {
        url: apiUrl,
        tenantId: userId,
        timezone,
        daysAhead,
        slotDurationMinutes,
        maxSlots
      });

      return {
        ...node,
        parameters: {
          ...node.parameters,
          url: apiUrl,
          jsonBody: jsonBody,
          method: 'POST',
          sendBody: true,
          specifyBody: 'json',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'Content-Type',
                value: 'application/json'
              }
            ]
          }
        }
      };
    }

    if (isBookEventNode) {
      console.log(`✅ Found "Book calendar events" node: "${node.name}" (${node.type})`);
      
      const apiUrl = `${baseUrl}/api/internal/calendar/book-event`;
      
      // Create JSON body with n8n expression syntax
      // Use workflowId (n8n will look up userId from it, like RAG API)
      // IMPORTANT: The AI Agent must pass start, end, title, description, and attendees as parameters
      // when calling this tool. These come from $json (the tool's input parameters).
      // The AI Agent receives slots from "Get available time slots" and must pass the selected slot
      // when calling "Book calendar events".
      const jsonBody = `={
  "workflowId": "{{ $workflow.id }}",
  "slot": {
    "start": "={{ $json.start }}",
    "end": "={{ $json.end }}"
  },
  "title": "={{ $json.title || 'Meeting' }}",
  "description": "={{ $json.description || 'Booked from Voxe' }}",
  "attendees": "={{ $json.attendees || [] }}",
  "addMeetLink": "={{ $json.addMeetLink !== undefined ? $json.addMeetLink : true }}"
}`;

      console.log(`✅ Updating "Book calendar events" node with:`, {
        url: apiUrl,
        tenantId: userId
      });

      // Configure tool parameters so AI Agent can pass start, end, title, etc.
      // In n8n's httpRequestTool, parameters need to be defined in toolParameters
      const toolParameters = {
        parameters: [
          {
            name: 'start',
            type: 'string',
            description: 'Start time of the selected slot in ISO 8601 format (e.g., "2025-01-15T14:00:00Z")',
            required: true
          },
          {
            name: 'end',
            type: 'string',
            description: 'End time of the selected slot in ISO 8601 format (e.g., "2025-01-15T14:30:00Z")',
            required: true
          },
          {
            name: 'title',
            type: 'string',
            description: 'Meeting title (e.g., "Consultation with [User Name]")',
            required: false
          },
          {
            name: 'description',
            type: 'string',
            description: 'Meeting description',
            required: false
          },
          {
            name: 'attendees',
            type: 'array',
            description: 'Array of attendee email addresses',
            required: false
          },
          {
            name: 'addMeetLink',
            type: 'boolean',
            description: 'Whether to add Google Meet link',
            required: false
          }
        ]
      };

      return {
        ...node,
        parameters: {
          ...node.parameters,
          url: apiUrl,
          jsonBody: jsonBody,
          method: 'POST',
          sendBody: true,
          specifyBody: 'json',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'Content-Type',
                value: 'application/json'
              }
            ]
          },
          // Add tool parameters so AI Agent can pass values
          toolParameters: toolParameters
        }
      };
    }

    return node;
  });

  // Check if we actually found and updated calendar nodes
  const hasCalendarNodes = updatedNodes.some((node: any, index: number) => 
    node !== workflow.nodes[index]
  );

  if (!hasCalendarNodes) {
    console.warn('⚠️  No calendar nodes found in workflow. Make sure nodes are named correctly:');
    console.warn('   - "Get available time slots" or similar');
    console.warn('   - "Book calendar events" or similar');
    return workflow; // Return unchanged workflow
  }

  // Update workflow in n8n
  const { baseUrl: n8nBaseUrl, apiKey: n8nApiKey } = (() => {
    const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    const apiKey = process.env.N8N_API_KEY || '';
    return { baseUrl, apiKey };
  })();

  // Update the workflow - only send the properties that n8n expects
  // Note: 'active' is read-only and cannot be updated via PUT
  const response = await fetch(`${n8nBaseUrl}/api/v1/workflows/${workflowId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': n8nApiKey,
    },
    body: JSON.stringify({
      name: workflow.name,
      nodes: updatedNodes,
      connections: workflow.connections,
      settings: workflow.settings || {},
      staticData: workflow.staticData || {}
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update workflow: ${response.status} ${errorText}`);
  }

  const updatedWorkflow = await response.json();
  console.log(`✅ Successfully updated calendar nodes in workflow ${workflowId}`);
  
  return updatedWorkflow;
}

/**
 * Toggle disabled state of calendar nodes in n8n workflows
 * @param userId - User ID to find all workflows
 * @param disabled - true to disable nodes, false to enable
 */
export async function toggleN8nCalendarNodes(userId: string, disabled: boolean): Promise<void> {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  // Get all workflows for this user
  const workflows = await prisma.workflow.findMany({
    where: {
      userId: userId,
      n8nWorkflowId: { not: null },
    },
    select: {
      n8nWorkflowId: true,
    },
  });

  console.log(`🔄 ${disabled ? 'Disabling' : 'Enabling'} calendar nodes in ${workflows.length} workflows...`);

  const { baseUrl: n8nBaseUrl, apiKey: n8nApiKey } = (() => {
    const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    const apiKey = process.env.N8N_API_KEY || '';
    return { baseUrl, apiKey };
  })();

  for (const workflow of workflows) {
    if (!workflow.n8nWorkflowId) continue;

    try {
      // Get current workflow
      const n8nWorkflow = await getN8nWorkflow(workflow.n8nWorkflowId);

      // Find and update calendar nodes
      const updatedNodes = n8nWorkflow.nodes.map((node: any) => {
        const isGetSlotsNode = 
          (node.name === 'Get available time slots' || 
           node.name.includes('Get available') || 
           node.name.includes('calendar slots')) &&
          (node.type === 'n8n-nodes-base.httpRequest' || 
           node.type === 'n8n-nodes-base.httpRequestTool');

        const isBookEventNode = 
          (node.name === 'Book calendar events' || 
           node.name.includes('Book calendar') || 
           node.name.includes('Book event')) &&
          (node.type === 'n8n-nodes-base.httpRequest' || 
           node.type === 'n8n-nodes-base.httpRequestTool');

        if (isGetSlotsNode || isBookEventNode) {
          console.log(`  ${disabled ? 'Disabling' : 'Enabling'} node: "${node.name}"`);
          return {
            ...node,
            disabled: disabled,
          };
        }

        return node;
      });

      // Check if any nodes were updated
      const hasChanges = updatedNodes.some((node: any, index: number) => 
        node.disabled !== n8nWorkflow.nodes[index]?.disabled
      );

      if (hasChanges) {
        // Update workflow in n8n
        const response = await fetch(`${n8nBaseUrl}/api/v1/workflows/${workflow.n8nWorkflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': n8nApiKey,
          },
          body: JSON.stringify({
            name: n8nWorkflow.name,
            nodes: updatedNodes,
            connections: n8nWorkflow.connections,
            settings: n8nWorkflow.settings || {},
            staticData: n8nWorkflow.staticData || {}
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to update workflow ${workflow.n8nWorkflowId}: ${errorText}`);
          // Continue with other workflows even if one fails
        } else {
          console.log(`✅ Updated workflow ${workflow.n8nWorkflowId}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating workflow ${workflow.n8nWorkflowId}:`, error);
      // Continue with other workflows even if one fails
    }
  }

  console.log(`✅ ${disabled ? 'Disabled' : 'Enabled'} calendar nodes in ${workflows.length} workflows`);
}

