import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateFusionModel, getModelDisplayName, convertToN8nModelFormat } from '@/lib/fusion-api';
import { updateN8nWorkflowModel } from '@/lib/n8n-api';
import { getDynamicTierLimits } from '@/lib/dynamic-tier-limits';

interface SwitchModelRequest {
  workflowId: string;
  model: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId, model }: SwitchModelRequest = await request.json();

    if (!workflowId || !model) {
      return NextResponse.json(
        { error: 'workflowId and model are required' },
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

    // Check if model switching is allowed
    // Model switching is only allowed when user is over quota AND has top-up credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        apiCallsThisMonth: true,
        balanceUsd: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const tierLimits = await getDynamicTierLimits(user.subscriptionTier as any);
    const quota = tierLimits.apiCallsPerMonth; // -1 means unlimited
    const isOverQuota = quota !== -1 && user.apiCallsThisMonth >= quota;
    const hasBalance = Number(user.balanceUsd) > 0;

    // Model switching is allowed when:
    // 1. User has exceeded their monthly quota OR
    // 2. User has top-up credits available
    // This creates an "unlocked feature" experience while ensuring cost control
    // (switching is only visible/available when using pay-as-you-go credits)
    if (!isOverQuota && !hasBalance) {
      return NextResponse.json(
        { 
          error: 'Model switching is only available when you have exceeded your monthly quota or have top-up credits available.',
          isOverQuota,
          hasBalance,
          apiCallsThisMonth: user.apiCallsThisMonth,
          quota: quota === -1 ? 'unlimited' : quota,
          balance: Number(user.balanceUsd)
        },
        { status: 403 }
      );
    }

    // Validate model exists in Fusion
    const isValidModel = await validateFusionModel(model);
    if (!isValidModel) {
      return NextResponse.json(
        { error: `Model ${model} not found in Fusion` },
        { status: 400 }
      );
    }

    // Convert model ID to n8n format
    const n8nModelFormat = await convertToN8nModelFormat(model);
    console.log(`🔄 Converting model: ${model} -> ${n8nModelFormat}`);

    // Update n8n workflow Fusion Chat Model nodes directly
    await updateN8nWorkflowModel(workflow.n8nWorkflowId, n8nModelFormat);

    // Update database
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        configuration: {
          ...workflow.configuration,
          aiModel: n8nModelFormat
        }
      }
    });

    // Get display name for confirmation message
    const displayName = await getModelDisplayName(model);

    return NextResponse.json({
      success: true,
      message: `Model switched to ${displayName} for ${workflow.demo.businessName}.`,
      workflowId: workflowId,
      model: model,
      n8nModelFormat: n8nModelFormat,
      displayName: displayName
    });

  } catch (error) {
    console.error('Model switch API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to switch model' },
      { status: 500 }
    );
  }
}
