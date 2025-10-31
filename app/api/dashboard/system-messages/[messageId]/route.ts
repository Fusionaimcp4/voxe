import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateN8nWorkflowSystemMessage } from '@/lib/n8n-api';
import path from 'path';
import fs from 'fs/promises';

interface UpdateSystemMessageRequest {
  messageId: string;
  content: string;
  structuredData?: any; // Optional structured data for future use
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const { content, structuredData } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Find the system message and verify ownership
    const systemMessage = await prisma.systemMessage.findUnique({
      where: { id: messageId },
      include: {
        demo: {
          select: {
            userId: true,
            slug: true,
            businessName: true,
            workflows: {
              where: { status: 'ACTIVE' },
              select: { n8nWorkflowId: true }
            }
          }
        }
      }
    });

    if (!systemMessage) {
      return NextResponse.json({ error: 'System message not found' }, { status: 404 });
    }

    if (systemMessage.demo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Replace ${businessName} placeholder with actual business name
    const processedContent = content.replace(/\$\{businessName\}/g, systemMessage.demo.businessName);

    // Update the system message in the database
    const updatedMessage = await prisma.systemMessage.update({
      where: { id: messageId },
      data: {
        content: processedContent,
        version: systemMessage.version + 1,
        updatedAt: new Date().toISOString(),
        sections: structuredData ? JSON.stringify(structuredData) : null
      }
    });

    // Update the corresponding file in public/system_messages
    const filePath = path.join(
      process.cwd(),
      'public',
      'system_messages',
      `n8n_System_Message_${systemMessage.demo.slug}.md`
    );
    await fs.writeFile(filePath, processedContent, 'utf-8');

    console.log(`✅ System message ${messageId} updated in DB and file system.`);

    // Update n8n workflow if an active workflow ID is available
    const activeWorkflow = systemMessage.demo.workflows.find(wf => wf.n8nWorkflowId);
    if (activeWorkflow?.n8nWorkflowId) {
      console.log(`🔄 Sending updated system message to n8n workflow ${activeWorkflow.n8nWorkflowId}...`);
      try {
        await updateN8nWorkflowSystemMessage(
          activeWorkflow.n8nWorkflowId,
          processedContent,
          systemMessage.demo.businessName
        );
        console.log(`✅ n8n workflow ${activeWorkflow.n8nWorkflowId} updated successfully.`);
      } catch (n8nError) {
        console.error(`❌ Failed to update n8n workflow ${activeWorkflow.n8nWorkflowId}:`, n8nError);
        // Continue processing, but log the n8n error
      }
    } else {
      console.log(`ℹ️ No active n8n workflow ID found for demo ${systemMessage.demo.slug}, skipping n8n update.`);
    }

    return NextResponse.json({
      success: true,
      message: 'System message updated successfully',
      systemMessage: updatedMessage,
    });
  } catch (error) {
    console.error('Error updating system message:', error);
    return NextResponse.json(
      { error: 'Failed to update system message' },
      { status: 500 }
    );
  }
}