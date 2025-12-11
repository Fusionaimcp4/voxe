import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toggleN8nRAGNodes } from '@/lib/n8n-api-rag';

/**
 * POST /api/dashboard/knowledge-bases/toggle-nodes
 * Toggle disabled state of RAG (Knowledge Base) nodes in n8n workflows
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

    // Toggle RAG nodes in all user's workflows
    await toggleN8nRAGNodes(userId, disabled);

    return NextResponse.json({
      success: true,
      message: `Knowledge Base nodes ${disabled ? 'disabled' : 'enabled'} successfully`,
    });

  } catch (error) {
    console.error('Error toggling Knowledge Base nodes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to toggle Knowledge Base nodes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

