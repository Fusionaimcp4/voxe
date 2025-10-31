import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/integrations/encryption';
import { CreateIntegrationRequest, CRMConfiguration } from '@/lib/integrations/types';
import { getCRMFormFields } from '@/lib/integrations/crm-providers';

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

    // Encrypt sensitive fields in configuration
    let processedConfiguration = { ...body.configuration };
    
    if (body.type === 'CRM') {
      const crmConfig = body.configuration as CRMConfiguration;
      
      // Get form fields to determine which fields are sensitive
      const formFields = getCRMFormFields(crmConfig.provider);
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

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        isActive: integration.isActive,
        createdAt: integration.createdAt,
      },
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

