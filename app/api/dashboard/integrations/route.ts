import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canPerformAction, trackUsage } from '@/lib/usage-tracking';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { decryptConfiguration } from '@/lib/integrations/crm-service';
import { CRMConfiguration } from '@/lib/integrations/types';

export async function GET(request: NextRequest) {
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

    // Fetch user's integrations
    const integrations = await prisma.integration.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Decrypt sensitive fields in configurations before sending to frontend
    const decryptedIntegrations = integrations.map(integration => {
      const config = integration.configuration as any;
      
      // Only decrypt if it's a CRM integration with a provider
      if (integration.type === 'CRM' && config?.provider) {
        try {
          const decryptedConfig = decryptConfiguration(config as CRMConfiguration);
          return {
            ...integration,
            configuration: decryptedConfig,
          };
        } catch (decryptError) {
          console.error(`[GET /api/dashboard/integrations] Failed to decrypt config for integration ${integration.id}:`, decryptError);
          // Return original if decryption fails
          return integration;
        }
      }
      
      return integration;
    });

    // Calculate stats
    const stats = {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.isActive).length,
      inactiveIntegrations: integrations.filter(i => !i.isActive).length,
      errorIntegrations: 0, // This would be calculated based on actual error states
    };

    return NextResponse.json({
      integrations: decryptedIntegrations,
      stats
    });

  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

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
    const userTier = (session.user.subscriptionTier as SubscriptionTier) || 'FREE';
    const body = await request.json();

    // Check if user is trying to create Chat Widget Script (paid feature)
    if (body.type === 'CHAT_WIDGET' && userTier === 'FREE') {
      return NextResponse.json(
        { 
          error: 'Feature requires paid plan',
          message: 'Chat Widget Script is only available for PRO, PRO_PLUS, and ENTERPRISE plans. Please upgrade to access this feature.',
          upgradeRequired: true,
          requiredTier: 'PRO'
        },
        { status: 403 }
      );
    }

    // Check tier limits before proceeding
    const usageCheck = await canPerformAction(userId, 'create_integration');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Tier limit exceeded',
          message: usageCheck.reason,
          usage: usageCheck.usage,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Validate input
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Create integration
    const integration = await prisma.integration.create({
      data: {
        userId,
        name: body.name.trim(),
        type: body.type,
        configuration: body.configuration || {},
        isActive: true,
      },
    });

    // Track usage
    await trackUsage(userId, 'integration_created');

    return NextResponse.json({
      success: true,
      integration,
    }, { status: 201 });

  } catch (error) {
    console.error('Create integration error:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
