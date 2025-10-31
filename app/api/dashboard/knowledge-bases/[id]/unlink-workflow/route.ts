/**
 * Unlink Knowledge Base from Workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// DELETE - Unlink KB from workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const kbId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Verify KB belongs to user
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
    });

    if (!kb || kb.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Knowledge base not found' },
        { status: 404 }
      );
    }

    // Find and delete the link
    const link = await prisma.workflowKnowledgeBase.findFirst({
      where: {
        workflowId,
        knowledgeBaseId: kbId,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    await prisma.workflowKnowledgeBase.delete({
      where: { id: link.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Knowledge base unlinked from workflow',
    });
  } catch (error) {
    console.error('[KB Unlink] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink knowledge base from workflow' },
      { status: 500 }
    );
  }
}

