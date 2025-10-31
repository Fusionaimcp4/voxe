/**
 * Webhook-based credential management for n8n
 * This creates a credential management endpoint that n8n can call
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FusionSubAccountService } from '@/lib/fusion-sub-accounts';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId, userId } = await request.json();

    if (!workflowId || !userId) {
      return NextResponse.json({ error: 'workflowId and userId are required' }, { status: 400 });
    }

    // Verify the user owns the workflow (or is an admin)
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { userId: true }
    });

    if (!workflow || workflow.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this workflow' }, { status: 403 });
    }

    // Get user's Fusion sub-account ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fusionSubAccountId: true }
    });

    if (!user?.fusionSubAccountId) {
      return NextResponse.json({ error: 'User does not have a Fusion sub-account' }, { status: 400 });
    }

    // Generate API key for the user
    const credentialName = `Fusionsubacountid-${user.fusionSubAccountId}`;
    const apiKeyResponse = await FusionSubAccountService.createApiKey(parseInt(user.fusionSubAccountId), credentialName);
    const apiKey = apiKeyResponse.apiKey;

    // Return the credential information for n8n to use
    return NextResponse.json({
      success: true,
      credential: {
        name: credentialName,
        type: 'fusionApi',
        data: {
          apiKey: apiKey,
          baseUrl: process.env.FUSION_BASE_URL || 'https://api.mcp4.ai',
          allowedDomains: ['*']
        }
      }
    });

  } catch (error) {
    console.error('Failed to generate credential:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
