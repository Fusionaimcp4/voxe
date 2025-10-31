import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testCRMConnection } from '@/lib/integrations/crm-service';
import { TestConnectionRequest } from '@/lib/integrations/types';

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

    const body: TestConnectionRequest = await request.json();
    
    // Validate request
    if (!body.type || !body.configuration) {
      return NextResponse.json(
        { error: 'Type and configuration are required' },
        { status: 400 }
      );
    }

    // Only support CRM testing for now
    if (body.type !== 'CRM') {
      return NextResponse.json(
        { error: 'Only CRM integration testing is supported' },
        { status: 400 }
      );
    }

    // Test the connection
    const result = await testCRMConnection(body.configuration);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Test connection API error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

