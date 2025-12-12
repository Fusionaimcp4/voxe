/**
 * Unlink Knowledge Base from Workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getN8nWorkflow } from '@/lib/n8n-api';
import { regenerateSystemMessageForWorkflow } from '@/lib/system-message-regenerate';

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

    // Check if this was the last KB linked to the workflow
    const remainingLinks = await prisma.workflowKnowledgeBase.findMany({
      where: {
        workflowId,
      },
    });

    // If no KBs are linked anymore, disable RAG node in n8n workflow
    if (remainingLinks.length === 0) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { n8nWorkflowId: true },
      });

      if (workflow?.n8nWorkflowId) {
        try {
          const n8nWorkflow = await getN8nWorkflow(workflow.n8nWorkflowId);
          const { baseUrl: n8nBaseUrl, apiKey: n8nApiKey } = (() => {
            const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
            const apiKey = process.env.N8N_API_KEY || '';
            return { baseUrl, apiKey };
          })();

          // Find and disable RAG node
          const updatedNodes = n8nWorkflow.nodes.map((node: any) => {
            const isRAGNode = 
              (node.name === 'Retrieve Knowledge Base Context' || 
               node.name.includes('Knowledge Base') ||
               node.name.includes('RAG')) && 
              (node.type === 'n8n-nodes-base.httpRequestTool' ||
               node.type === 'n8n-nodes-base.httpRequest');

            if (isRAGNode && !node.disabled) {
              console.log(`  Disabling RAG node: "${node.name}" (no KBs linked)`);
              return {
                ...node,
                disabled: true,
              };
            }

            return node;
          });

          // Check if any nodes were updated
          const hasChanges = updatedNodes.some((node: any, index: number) => 
            node.disabled !== n8nWorkflow.nodes[index]?.disabled
          );

          if (hasChanges) {
            const response = await fetch(`${n8nBaseUrl}/api/v1/workflows/${workflow.n8nWorkflowId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': n8nApiKey,
              },
              body: JSON.stringify({
                name: n8nWorkflow.name,
                nodes: updatedNodes,
                connections: n8nWorkflow.connections,
                settings: n8nWorkflow.settings || {},
                staticData: n8nWorkflow.staticData || {}
              }),
            });

            if (response.ok) {
              console.log(`✅ RAG node disabled in workflow ${workflow.n8nWorkflowId} (no KBs linked)`);
            } else {
              console.warn(`⚠️ Failed to disable RAG node (non-critical)`);
            }
          }
        } catch (disableError) {
          console.warn('⚠️ Failed to disable RAG node (non-critical):', disableError);
          // Don't fail the entire operation if node disable fails
        }
      }

      // Regenerate system message to remove KB section if it was the last KB
      // This will update both the database/file AND n8n workflow
      if (remainingLinks.length === 0) {
        try {
          console.log(`🔄 [KB Unlink] Regenerating system message for workflow ${workflowId} (last KB unlinked)...`);
          await regenerateSystemMessageForWorkflow(workflowId);
          console.log(`✅ [KB Unlink] System message regenerated without KB section and n8n workflow updated`);
        } catch (regenError) {
          console.error('❌ [KB Unlink] Failed to regenerate system message:', regenError);
          console.error('   Error details:', regenError instanceof Error ? regenError.stack : String(regenError));
          // Don't fail the operation if regeneration fails, but log the error clearly
        }
      }
    }

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

