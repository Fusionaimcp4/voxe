/**
 * Link Knowledge Base to Workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateN8nWorkflowRAGSettings, toggleN8nRAGNodes } from '@/lib/n8n-api-rag';
import { getN8nWorkflow } from '@/lib/n8n-api';
import { regenerateSystemMessageForWorkflow } from '@/lib/system-message-regenerate';

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

    // Update n8n workflow RAG settings and enable RAG node if n8nWorkflowId exists
    if (workflow.n8nWorkflowId) {
      try {
        console.log(`🔄 Updating n8n workflow ${workflow.n8nWorkflowId} RAG settings...`);
        await updateN8nWorkflowRAGSettings(workflow.n8nWorkflowId, {
          retrievalLimit,
          similarityThreshold,
          // Keep existing URL or use default
        });
        console.log(`✅ n8n workflow RAG settings updated successfully`);

        // Enable RAG node in the workflow (it starts disabled after duplication)
        try {
          const n8nWorkflow = await getN8nWorkflow(workflow.n8nWorkflowId);
          const { baseUrl: n8nBaseUrl, apiKey: n8nApiKey } = (() => {
            const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
            const apiKey = process.env.N8N_API_KEY || '';
            return { baseUrl, apiKey };
          })();

          // Find and enable RAG node
          const updatedNodes = n8nWorkflow.nodes.map((node: any) => {
            const isRAGNode = 
              (node.name === 'Retrieve Knowledge Base Context' || 
               node.name.includes('Knowledge Base') ||
               node.name.includes('RAG')) && 
              (node.type === 'n8n-nodes-base.httpRequestTool' ||
               node.type === 'n8n-nodes-base.httpRequest');

            if (isRAGNode && node.disabled) {
              console.log(`  Enabling RAG node: "${node.name}"`);
              return {
                ...node,
                disabled: false,
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
              console.log(`✅ RAG node enabled in workflow ${workflow.n8nWorkflowId}`);
            } else {
              console.warn(`⚠️ Failed to enable RAG node (non-critical)`);
            }
          }
        } catch (enableError) {
          console.warn('⚠️ Failed to enable RAG node (non-critical):', enableError);
          // Don't fail the entire operation if node enable fails
        }
      } catch (n8nError) {
        // Log but don't fail the operation if n8n update fails
        console.error('[KB Link] n8n update failed (non-critical):', n8nError);
        console.log('💡 Link created successfully, but n8n workflow needs manual update');
      }

      // Regenerate system message to include KB section
      // This will update both the database/file AND n8n workflow
      try {
        console.log(`🔄 [KB Link] Regenerating system message for workflow ${workflowId} (KB linked)...`);
        await regenerateSystemMessageForWorkflow(workflowId);
        console.log(`✅ [KB Link] System message regenerated with KB section and n8n workflow updated`);
      } catch (regenError) {
        console.error('❌ [KB Link] Failed to regenerate system message:', regenError);
        console.error('   Error details:', regenError instanceof Error ? regenError.stack : String(regenError));
        // Don't fail the operation if regeneration fails, but log the error clearly
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

