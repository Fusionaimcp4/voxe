import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateN8nWorkflowTimingThresholds } from '@/lib/n8n-api';

interface UpdateTimingThresholdsRequest {
  workflowId: string;
  assigneeThreshold: number;
  teamThreshold: number;
  escalationThreshold: number;
  escalationContact?: string;
  escalationMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      workflowId, 
      assigneeThreshold, 
      teamThreshold, 
      escalationThreshold,
      escalationContact,
      escalationMessage
    }: UpdateTimingThresholdsRequest = await request.json();

    if (!workflowId || assigneeThreshold === undefined || teamThreshold === undefined || escalationThreshold === undefined) {
      return NextResponse.json(
        { error: 'workflowId, assigneeThreshold, teamThreshold, and escalationThreshold are required' },
        { status: 400 }
      );
    }

    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: session.user.id
      },
      include: {
        demo: {
          select: {
            businessName: true,
            slug: true
          }
        }
      }
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (!workflow.n8nWorkflowId) {
      return NextResponse.json(
        { error: 'n8n workflow ID not found. Please ensure the workflow was properly created.' },
        { status: 400 }
      );
    }

    // Update n8n workflow Code node with new timing thresholds
    await updateN8nWorkflowTimingThresholds(workflow.n8nWorkflowId, {
      assigneeThreshold,
      teamThreshold,
      escalationThreshold,
      escalationContact,
      escalationMessage
    });

    // Update database
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        configuration: {
          ...workflow.configuration,
          timingThresholds: {
            assigneeThreshold,
            teamThreshold,
            escalationThreshold,
            escalationContact,
            escalationMessage
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Timing thresholds updated for ${workflow.demo.businessName}.`,
      workflowId: workflowId,
      thresholds: {
        assigneeThreshold,
        teamThreshold,
        escalationThreshold,
        escalationContact,
        escalationMessage
      }
    });

  } catch (error) {
    console.error('Timing thresholds update API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update timing thresholds' },
      { status: 500 }
    );
  }
}
