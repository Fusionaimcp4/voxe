/**
 * Link Knowledge Base to Workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateN8nWorkflowRAGSettings } from '@/lib/n8n-api-rag';

export const runtime = 'nodejs';

// POST - Link KB to workflow
export async function POST(
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
    const { 
      workflowId, 
      priority = 1, 
      retrievalLimit = 5, 
      similarityThreshold = 0.4 
    } = body;

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

    // Verify workflow belongs to user
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow || workflow.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if link already exists
    const existingLink = await prisma.workflowKnowledgeBase.findFirst({
      where: {
        workflowId,
        knowledgeBaseId: kbId,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'Knowledge base is already linked to this workflow' },
        { status: 400 }
      );
    }

    // Create the link
    const link = await prisma.workflowKnowledgeBase.create({
      data: {
        workflowId,
        knowledgeBaseId: kbId,
        priority,
        retrievalLimit,
        similarityThreshold,
        isActive: true,
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

    // Update n8n workflow RAG settings if n8nWorkflowId exists
    if (workflow.n8nWorkflowId) {
      try {
        console.log(`🔄 Updating n8n workflow ${workflow.n8nWorkflowId} RAG settings...`);
        await updateN8nWorkflowRAGSettings(workflow.n8nWorkflowId, {
          retrievalLimit,
          similarityThreshold,
          // Keep existing URL or use default
        });
        console.log(`✅ n8n workflow RAG settings updated successfully`);
      } catch (n8nError) {
        // Log but don't fail the operation if n8n update fails
        console.error('[KB Link] n8n update failed (non-critical):', n8nError);
        console.log('💡 Link created successfully, but n8n workflow needs manual update');
      }
    } else {
      console.log('⚠️  No n8nWorkflowId found, skipping n8n update');
    }

    return NextResponse.json({
      success: true,
      link,
    });
  } catch (error) {
    console.error('[KB Link] Error:', error);
    return NextResponse.json(
      { error: 'Failed to link knowledge base to workflow' },
      { status: 500 }
    );
  }
}

