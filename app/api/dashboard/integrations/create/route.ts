import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/integrations/encryption';
import { CreateIntegrationRequest, CRMConfiguration } from '@/lib/integrations/types';
import { getCRMFormFields } from '@/lib/integrations/crm-providers';
import { deactivateChatvoxeIntegration } from '@/lib/integrations/crm-service';
import { canPerformAction, trackUsage } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
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
    const body: CreateIntegrationRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Check tier limits before proceeding (enforces maxIntegrations from tier limits table)
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

    // Encrypt sensitive fields in configuration
    let processedConfiguration = { ...body.configuration };
    let switchedFromChatvoxe = false;
    let deactivatedIntegration = null;
    
    if (body.type === 'CALENDAR') {
      // Encrypt OAuth credentials for calendar integrations
      const calendarConfig = body.configuration as any;
      if (calendarConfig.oauthClientId && !calendarConfig.oauthClientId.includes(':')) {
        processedConfiguration.oauthClientId = encrypt(calendarConfig.oauthClientId);
      }
      if (calendarConfig.oauthClientSecret && !calendarConfig.oauthClientSecret.includes(':')) {
        processedConfiguration.oauthClientSecret = encrypt(calendarConfig.oauthClientSecret);
      }
    } else if (body.type === 'CRM') {
      const helpdeskConfig = body.configuration as CRMConfiguration;
      
      // Check if user is switching from CHATVOXE to their own Chatwoot instance
      if (helpdeskConfig.provider === 'CHATWOOT') {
        const chatvoxeInfo = await deactivateChatvoxeIntegration(userId);
        if (chatvoxeInfo) {
          switchedFromChatvoxe = true;
          deactivatedIntegration = chatvoxeInfo;
          console.log(`[create-integration] User ${userId} is switching from CHATVOXE to their own Chatwoot instance`);
          console.log(`[create-integration] Deactivated CHATVOXE integration: ${chatvoxeInfo.id}`);
        }
      }
      
      // Get form fields to determine which fields are sensitive
      const formFields = getCRMFormFields(helpdeskConfig.provider);
      const sensitiveFields = formFields
        .filter(field => field.sensitive)
        .map(field => field.name);
      
      // Encrypt sensitive fields
      for (const fieldPath of sensitiveFields) {
        const keys = fieldPath.split('.');
        let obj: any = processedConfiguration;
        
        // Navigate to the nested field
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        if (obj[lastKey]) {
          // Only encrypt if not already encrypted
          if (!obj[lastKey].includes(':')) {
            obj[lastKey] = encrypt(obj[lastKey]);
          }
        }
      }
    }

    // Create integration in database
    const integration = await prisma.integration.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        configuration: processedConfiguration,
        isActive: true,
      },
    });

    // Track usage (counts towards tier limit)
    await trackUsage(userId, 'integration_created');

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        isActive: integration.isActive,
        createdAt: integration.createdAt,
      },
      ...(switchedFromChatvoxe && {
        switchedFromChatvoxe: true,
        deactivatedIntegration: {
          id: deactivatedIntegration.id,
          name: deactivatedIntegration.name,
        },
      }),
    });

  } catch (error) {
    console.error('Create integration API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

