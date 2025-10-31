import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt } from '@/lib/integrations/encryption';
import { UpdateIntegrationRequest, CRMConfiguration } from '@/lib/integrations/types';
import { getCRMFormFields } from '@/lib/integrations/crm-providers';

// GET - Fetch single integration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ integration });

  } catch (error) {
    console.error('Get integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    );
  }
}

// PUT - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;
    const body: UpdateIntegrationRequest = await request.json();

    // Verify integration belongs to user
    const existing = await prisma.integration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Process configuration if provided
    let processedConfiguration = body.configuration;
    
    if (body.configuration && existing.type === 'CRM') {
      const existingConfig = existing.configuration as any;
      const updatedConfig = { ...existingConfig, ...body.configuration };
      
      // Get form fields to determine which fields are sensitive
      const formFields = getCRMFormFields(updatedConfig.provider);
      const sensitiveFields = formFields
        .filter(field => field.sensitive)
        .map(field => field.name);
      
      // Encrypt sensitive fields if they're being updated
      for (const fieldPath of sensitiveFields) {
        const keys = fieldPath.split('.');
        let obj: any = updatedConfig;
        
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
      
      processedConfiguration = updatedConfig;
    }

    // Update integration
    const integration = await prisma.integration.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(processedConfiguration && { configuration: processedConfiguration }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        isActive: integration.isActive,
        updatedAt: integration.updatedAt,
      },
    });

  } catch (error) {
    console.error('Update integration API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify integration belongs to user
    const existing = await prisma.integration.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Delete integration
    await prisma.integration.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Integration deleted successfully',
    });

  } catch (error) {
    console.error('Delete integration API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

