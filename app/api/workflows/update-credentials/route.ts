import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { n8nCredentialService } from '@/lib/n8n-credentials';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Verify the workflow belongs to the user
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: session.user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found or access denied' },
        { status: 404 }
      );
    }

    // Update the workflow with user-specific Fusion credentials
    await n8nCredentialService.updateWorkflowCredential(workflowId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Workflow credentials updated successfully',
    });

  } catch (error) {
    console.error('Failed to update workflow credentials:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update workflow credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
