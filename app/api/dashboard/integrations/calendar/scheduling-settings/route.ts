import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserGoogleCalendarConfig } from '@/lib/integrations/calendar-service';
import { CalendarSchedulingSettings } from '@/lib/integrations/types';
import { updateN8nWorkflowCalendarNodes } from '@/lib/n8n-api-calendar';

/**
 * POST /api/dashboard/integrations/calendar/scheduling-settings
 * Save scheduling settings and update n8n workflows
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
    const { integrationId, schedulingSettings } = await request.json();

    if (!integrationId || !schedulingSettings) {
      return NextResponse.json(
        { error: 'integrationId and schedulingSettings are required' },
        { status: 400 }
      );
    }

    // Verify integration belongs to user
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        userId: userId,
        type: 'CALENDAR',
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Calendar integration not found' },
        { status: 404 }
      );
    }

    // Update integration configuration with scheduling settings
    const updatedConfig = {
      ...(integration.configuration as any),
      schedulingSettings: schedulingSettings as CalendarSchedulingSettings,
    };

    const updatedIntegration = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        configuration: updatedConfig,
      },
    });

    // Update all n8n workflows for this user
    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          userId: userId,
          n8nWorkflowId: { not: null },
        },
        select: {
          n8nWorkflowId: true,
        },
      });

      console.log(`🔄 Updating ${workflows.length} workflows with new calendar scheduling settings...`);

      for (const workflow of workflows) {
        if (workflow.n8nWorkflowId) {
          try {
            await updateN8nWorkflowCalendarNodes(workflow.n8nWorkflowId);
            console.log(`✅ Updated workflow ${workflow.n8nWorkflowId}`);
          } catch (error) {
            console.error(`❌ Failed to update workflow ${workflow.n8nWorkflowId}:`, error);
            // Continue with other workflows even if one fails
          }
        }
      }

      console.log(`✅ Successfully updated ${workflows.length} workflows`);
    } catch (n8nError) {
      console.error('Failed to update n8n workflows (non-critical):', n8nError);
      // Don't fail the entire request if n8n update fails
      // The settings are saved in the database, n8n can be updated later
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduling settings saved successfully',
      integration: updatedIntegration,
    });

  } catch (error) {
    console.error('Error saving scheduling settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save scheduling settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

