import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateN8nWorkflowStatus, startN8nWorkflow, stopN8nWorkflow, getN8nWorkflowExecutions } from '@/lib/n8n-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string, action: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { workflowId, action } = await params;

    // Verify workflow belongs to user and get n8n workflow ID
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId
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

    let newStatus = workflow.status;
    let n8nResponse = null;

    // Handle different actions
    switch (action) {
      case 'start':
        try {
          console.log(`🔄 Starting n8n workflow ${workflow.n8nWorkflowId} for ${workflow.demo.businessName}...`);
          
          // Update n8n workflow to active
          n8nResponse = await updateN8nWorkflowStatus(workflow.n8nWorkflowId, true);
          console.log(`✅ n8n workflow ${workflow.n8nWorkflowId} activated successfully`);
          
          newStatus = 'ACTIVE';
        } catch (n8nError) {
          console.error(`❌ Failed to start n8n workflow ${workflow.n8nWorkflowId}:`, n8nError);
          return NextResponse.json(
            { error: `Failed to start workflow: ${n8nError instanceof Error ? n8nError.message : 'Unknown error'}` },
            { status: 500 }
          );
        }
        break;
      
      case 'stop':
        try {
          console.log(`🔄 Stopping n8n workflow ${workflow.n8nWorkflowId} for ${workflow.demo.businessName}...`);
          
          // Update n8n workflow to inactive
          n8nResponse = await updateN8nWorkflowStatus(workflow.n8nWorkflowId, false);
          console.log(`✅ n8n workflow ${workflow.n8nWorkflowId} deactivated successfully`);
          
          newStatus = 'INACTIVE';
        } catch (n8nError) {
          console.error(`❌ Failed to stop n8n workflow ${workflow.n8nWorkflowId}:`, n8nError);
          return NextResponse.json(
            { error: `Failed to stop workflow: ${n8nError instanceof Error ? n8nError.message : 'Unknown error'}` },
            { status: 500 }
          );
        }
        break;
      
      case 'restart':
        try {
          console.log(`🔄 Restarting n8n workflow ${workflow.n8nWorkflowId} for ${workflow.demo.businessName}...`);
          
          // First stop, then start
          await updateN8nWorkflowStatus(workflow.n8nWorkflowId, false);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          n8nResponse = await updateN8nWorkflowStatus(workflow.n8nWorkflowId, true);
          console.log(`✅ n8n workflow ${workflow.n8nWorkflowId} restarted successfully`);
          
          newStatus = 'ACTIVE';
        } catch (n8nError) {
          console.error(`❌ Failed to restart n8n workflow ${workflow.n8nWorkflowId}:`, n8nError);
          return NextResponse.json(
            { error: `Failed to restart workflow: ${n8nError instanceof Error ? n8nError.message : 'Unknown error'}` },
            { status: 500 }
          );
        }
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update workflow status
    const updatedWorkflow = await prisma.workflow.update({
      where: {
        id: workflowId
      },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      n8nResponse: n8nResponse,
      message: `Workflow ${action} successful`
    });

  } catch (error) {
    console.error('Workflow action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform workflow action' },
      { status: 500 }
    );
  }
}
