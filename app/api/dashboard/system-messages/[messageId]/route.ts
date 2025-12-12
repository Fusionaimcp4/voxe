import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateN8nWorkflowSystemMessage } from '@/lib/n8n-api';
import { getPublishedSystemMessageTemplate } from '@/lib/system-message-template';
import { detectWorkflowFeatures } from '@/lib/system-message-features';
import { 
  parseTemplateSections, 
  generateDynamicSystemMessage,
  validateEditableSection,
  extractEditableContent,
  type EditableContent 
} from '@/lib/system-message-sections';
import path from 'path';
import fs from 'fs/promises';

interface UpdateSystemMessageRequest {
  editableContent?: EditableContent; // Only editable sections
  content?: string; // Legacy: full content (for backward compatibility)
  structuredData?: any;
}

// GET - Get system message with structured sections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
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
              select: { id: true, n8nWorkflowId: true }
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

    // Get active workflow for feature detection
    const activeWorkflow = systemMessage.demo.workflows.find(wf => wf.n8nWorkflowId);
    if (!activeWorkflow) {
      return NextResponse.json({ error: 'No active workflow found' }, { status: 404 });
    }

    // Detect features for this workflow
    const features = await detectWorkflowFeatures(activeWorkflow.id);

    // Get template
    const template = await getPublishedSystemMessageTemplate();

    // Parse template sections
    const sections = parseTemplateSections(template);

    // Get editable content from database (or use defaults from template)
    const editableContent: EditableContent = (systemMessage.editableContent as EditableContent) || {};
    
    // Fill in missing editable sections from template defaults
    sections.forEach(section => {
      if (section.type === 'EDITABLE' && !editableContent[section.id]) {
        editableContent[section.id] = section.content;
      }
    });

    // Build protected sections object
    const protectedSections: Record<string, string | null> = {};
    sections.forEach(section => {
      if (section.type === 'PROTECTED') {
        // Only include if feature is enabled (for feature-specific sections)
        if (section.id === 'kb_usage' && !features.hasKnowledgeBase) {
          protectedSections[section.id] = null;
        } else if (section.id === 'calendar_booking' && !features.hasCalendar) {
          protectedSections[section.id] = null;
        } else {
          protectedSections[section.id] = section.content.replace(/\$\{businessName\}/g, systemMessage.demo.businessName);
        }
      }
    });

    // Generate preview (full message)
    const preview = generateDynamicSystemMessage(
      template,
      features,
      editableContent,
      systemMessage.demo.businessName
    );

    return NextResponse.json({
      id: systemMessage.id,
      demoId: systemMessage.demoId,
      features,
      protectedSections,
      editableSections: editableContent,
      preview,
      version: systemMessage.version,
      updatedAt: systemMessage.updatedAt
    });
  } catch (error) {
    console.error('Error fetching system message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system message' },
      { status: 500 }
    );
  }
}

// PUT - Update system message (only editable sections)
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
    const body: UpdateSystemMessageRequest = await request.json();

    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
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
              select: { id: true, n8nWorkflowId: true }
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

    // Get active workflow for feature detection
    const activeWorkflow = systemMessage.demo.workflows.find(wf => wf.n8nWorkflowId);
    if (!activeWorkflow) {
      return NextResponse.json({ error: 'No active workflow found' }, { status: 404 });
    }

    // Detect features
    const features = await detectWorkflowFeatures(activeWorkflow.id);

    // Get template
    const template = await getPublishedSystemMessageTemplate();

    let editableContent: EditableContent;
    let finalContent: string;

    // Handle new format (editableContent) or legacy format (full content)
    if (body.editableContent) {
      // New format: validate and use editable content
      editableContent = body.editableContent;

      // Validate each editable section
      for (const [sectionId, content] of Object.entries(editableContent)) {
        const validation = validateEditableSection(sectionId, content);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error || 'Invalid content in editable section' },
            { status: 400 }
          );
        }
      }

      // Generate dynamic message
      finalContent = generateDynamicSystemMessage(
        template,
        features,
        editableContent,
        systemMessage.demo.businessName
      );
    } else if (body.content) {
      // Legacy format: accept full content (backward compatibility)
      // Extract editable sections from full content for storage
      editableContent = extractEditableContent(template, body.content);
      finalContent = body.content.replace(/\$\{businessName\}/g, systemMessage.demo.businessName);
    } else {
      return NextResponse.json(
        { error: 'Either editableContent or content is required' },
        { status: 400 }
      );
    }

    // Update the system message in the database
    const updateData: any = {
      content: finalContent,
      editableContent: editableContent as any,
      version: systemMessage.version + 1,
      updatedAt: new Date(),
    };

    if (body.structuredData) {
      updateData.sections = JSON.stringify(body.structuredData);
    } else if (systemMessage.sections !== null && systemMessage.sections !== undefined) {
      updateData.sections = systemMessage.sections;
    }

    const updatedMessage = await prisma.systemMessage.update({
      where: { id: messageId },
      data: updateData
    });

    // Update the corresponding file in public/system_messages
    const filePath = path.join(
      process.cwd(),
      'public',
      'system_messages',
      `n8n_System_Message_${systemMessage.demo.slug}.md`
    );
    await fs.writeFile(filePath, finalContent, 'utf-8');

    console.log(`✅ System message ${messageId} updated in DB and file system.`);

    // Update n8n workflow if an active workflow ID is available
    if (activeWorkflow.n8nWorkflowId) {
      console.log(`🔄 Sending updated system message to n8n workflow ${activeWorkflow.n8nWorkflowId}...`);
      try {
        await updateN8nWorkflowSystemMessage(
          activeWorkflow.n8nWorkflowId,
          finalContent,
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
    }    );
  } catch (error) {
    console.error('Error updating system message:', error);
    return NextResponse.json(
      { error: 'Failed to update system message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}