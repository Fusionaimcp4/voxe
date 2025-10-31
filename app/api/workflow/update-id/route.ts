import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { n8nCredentialService } from '@/lib/n8n-credentials';

interface WorkflowIdPayload {
  businessName: string;
  workflowId: string;
  // Chatwoot IDs are optional - n8n doesn't have them
  chatwootInboxId?: number;
  chatwootWebsiteToken?: string;
  chatwootAgentBotId?: string;
  chatwootAgentBotAccessToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: WorkflowIdPayload = await request.json();
    
    console.log('📋 Received workflow ID update:', payload);

    if (!payload.businessName || !payload.workflowId) {
      return NextResponse.json(
        { error: 'businessName and workflowId are required' },
        { status: 400 }
      );
    }

    // Find the demo by business name with retry logic for timing issues
    let demo = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!demo && attempts < maxAttempts) {
      attempts++;
      
      // Try exact business name first
      demo = await prisma.demo.findFirst({
        where: {
          businessName: payload.businessName
        },
        include: {
          workflows: {
            where: {
              status: 'ACTIVE'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // If not found and business name ends with " demo", try without it
      if (!demo && payload.businessName.endsWith(' demo')) {
        const baseBusinessName = payload.businessName.replace(' demo', '');
        demo = await prisma.demo.findFirst({
          where: {
            businessName: baseBusinessName
          },
          include: {
            workflows: {
              where: {
                status: 'ACTIVE'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      }

      // If still not found, wait a bit and try again (for timing issues)
      if (!demo && attempts < maxAttempts) {
        console.log(`⏳ Demo not found on attempt ${attempts}, waiting 1 second before retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!demo) {
      console.error(`❌ Demo not found for business: ${payload.businessName}`);
      return NextResponse.json(
        { error: 'Demo not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found demo: ${demo.id} for business: ${payload.businessName}`);

    // Update the workflow with the n8n workflow ID
    if (demo.workflows.length > 0) {
      const workflow = demo.workflows[0];
      
      const updatedWorkflow = await prisma.workflow.update({
        where: { id: workflow.id },
        data: {
          n8nWorkflowId: payload.workflowId
        }
      });

      console.log(`✅ Updated workflow ${workflow.id} with n8n ID: ${payload.workflowId}`);
      
      // Update Fusion credentials for this workflow (following system message update pattern)
      try {
        console.log(`🔄 Setting up user-specific Fusion credentials for workflow ${payload.workflowId}...`);
        await n8nCredentialService.updateWorkflowCredential(payload.workflowId, demo.userId);
        console.log(`✅ Updated workflow ${payload.workflowId} with user-specific Fusion credentials`);
      } catch (credentialError) {
        console.error('Failed to update workflow credentials:', credentialError);
        // Don't fail the entire workflow update if credential update fails
      }
    } else {
      // Create a new workflow record if none exists
      const newWorkflow = await prisma.workflow.create({
        data: {
          userId: demo.userId,
          demoId: demo.id,
          n8nWorkflowId: payload.workflowId,
          status: 'ACTIVE',
          configuration: {
            aiModel: 'gpt-4o-mini',
            confidenceThreshold: 0.8,
            escalationRules: [],
            externalIntegrations: []
          }
        }
      });

      console.log(`✅ Created new workflow ${newWorkflow.id} with n8n ID: ${payload.workflowId}`);
      
      // Update Fusion credentials for this new workflow (following system message update pattern)
      try {
        console.log(`🔄 Setting up user-specific Fusion credentials for new workflow ${payload.workflowId}...`);
        await n8nCredentialService.updateWorkflowCredential(payload.workflowId, demo.userId);
        console.log(`✅ Updated new workflow ${payload.workflowId} with user-specific Fusion credentials`);
      } catch (credentialError) {
        console.error('Failed to update new workflow credentials:', credentialError);
        // Don't fail the entire workflow update if credential update fails
      }
    }

    // Optionally update Chatwoot IDs if provided (n8n usually doesn't have these)
    if (payload.chatwootInboxId || payload.chatwootWebsiteToken) {
      const updateData: any = {};
      
      if (payload.chatwootInboxId) updateData.chatwootInboxId = payload.chatwootInboxId;
      if (payload.chatwootWebsiteToken) updateData.chatwootWebsiteToken = payload.chatwootWebsiteToken;

      await prisma.demo.update({
        where: { id: demo.id },
        data: updateData
      });

      console.log(`✅ Updated Chatwoot IDs for demo: ${demo.id}`);
    } else {
      console.log(`ℹ️ No Chatwoot IDs provided - n8n doesn't have access to these`);
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow ID updated successfully',
      demoId: demo.id,
      workflowId: payload.workflowId
    });

  } catch (error) {
    console.error('❌ Error updating workflow ID:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow ID' },
      { status: 500 }
    );
  }
}
