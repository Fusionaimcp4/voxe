/**
 * Manage Workflow Links for a Knowledge Base
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateN8nWorkflowRAGSettings } from '@/lib/n8n-api-rag';

export const runtime = 'nodejs';

// GET - Get all workflow links for a KB
export async function GET(
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

    // Get all workflow links
    const links = await prisma.workflowKnowledgeBase.findMany({
      where: {
        knowledgeBaseId: kbId,
      },
      include: {
        workflow: {
          include: {
            demo: true,
          },
        },
      },
      orderBy: {
        priority: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      links,
    });
  } catch (error) {
    console.error('[KB Workflow Links] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow links' },
      { status: 500 }
    );
  }
}

// PUT - Update a workflow link
export async function PUT(
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
    const body = await request.json();
    const { linkId, priority, retrievalLimit, similarityThreshold, isActive } = body;

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
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

    // Find the link
    const link = await prisma.workflowKnowledgeBase.findUnique({
      where: { id: linkId },
    });

    if (!link || link.knowledgeBaseId !== kbId) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Update the link
    const updatedLink = await prisma.workflowKnowledgeBase.update({
      where: { id: linkId },
      data: {
        ...(priority !== undefined && { priority }),
        ...(retrievalLimit !== undefined && { retrievalLimit }),
        ...(similarityThreshold !== undefined && { similarityThreshold }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        workflow: {
          include: {
            demo: true,
          },
        },
        knowledgeBase: true,
      },
    });

    // Update n8n workflow RAG settings if retrieval or similarity settings changed
    if (updatedLink.workflow.n8nWorkflowId && (retrievalLimit !== undefined || similarityThreshold !== undefined)) {
      try {
        console.log(`🔄 Updating n8n workflow ${updatedLink.workflow.n8nWorkflowId} RAG settings...`);
        await updateN8nWorkflowRAGSettings(updatedLink.workflow.n8nWorkflowId, {
          retrievalLimit: updatedLink.retrievalLimit,
          similarityThreshold: updatedLink.similarityThreshold,
        });
        console.log(`✅ n8n workflow RAG settings updated successfully`);
      } catch (n8nError) {
        console.error('[KB Update Link] n8n update failed (non-critical):', n8nError);
        console.log('💡 Link updated successfully, but n8n workflow needs manual update');
      }
    }

    return NextResponse.json({
      success: true,
      link: updatedLink,
    });
  } catch (error) {
    console.error('[KB Update Link] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow link' },
      { status: 500 }
    );
  }
}

