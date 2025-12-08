import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toggleN8nCalendarNodes } from '@/lib/n8n-api-calendar';

/**
 * POST /api/dashboard/integrations/calendar/toggle-nodes
 * Toggle disabled state of calendar nodes in n8n workflows
 */
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
    const { disabled } = await request.json();

    if (typeof disabled !== 'boolean') {
      return NextResponse.json(
        { error: 'disabled must be a boolean' },
        { status: 400 }
      );
    }

    // Toggle calendar nodes in all user's workflows
    await toggleN8nCalendarNodes(userId, disabled);

    return NextResponse.json({
      success: true,
      message: `Calendar nodes ${disabled ? 'disabled' : 'enabled'} successfully`,
    });

  } catch (error) {
    console.error('Error toggling calendar nodes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to toggle calendar nodes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

