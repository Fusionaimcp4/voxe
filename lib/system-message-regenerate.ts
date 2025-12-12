/**
 * System Message Regeneration
 * Regenerates system messages when features change (KB linked/unlinked, Calendar enabled/disabled)
 */

import { prisma } from '@/lib/prisma';
import { getPublishedSystemMessageTemplate } from '@/lib/system-message-template';
import { detectWorkflowFeatures, detectUserFeatures } from '@/lib/system-message-features';
import { generateDynamicSystemMessage, type EditableContent } from '@/lib/system-message-sections';
import { updateN8nWorkflowSystemMessage } from '@/lib/n8n-api';
import path from 'path';
import fs from 'fs/promises';

/**
 * Regenerate system message for a specific workflow
 * Called when KB is linked/unlinked or Calendar is enabled/disabled
 */
export async function regenerateSystemMessageForWorkflow(workflowId: string): Promise<void> {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  // Get workflow with demo info and n8nWorkflowId
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      n8nWorkflowId: true, // Explicitly include n8nWorkflowId
      userId: true,
      demo: {
        select: {
          id: true,
          slug: true,
          businessName: true,
          systemMessages: { // Note: plural, not singular
            select: {
              id: true,
              content: true,
              editableContent: true
            }
          }
        }
      }
    }
  });

  if (!workflow || !workflow.demo) {
    console.warn(`⚠️ Workflow ${workflowId} or demo not found, skipping regeneration`);
    return;
  }

  // systemMessages is an optional single relation (SystemMessage?), so it's either an object or null
  const systemMessage = workflow.demo.systemMessages;
  if (!systemMessage) {
    console.warn(`⚠️ No system message found for workflow ${workflowId}, skipping regeneration`);
    return;
  }
  
  const message = systemMessage; // It's already a single object, not an array

  try {
    // Detect current features
    const features = await detectWorkflowFeatures(workflowId);

    // Get template
    const template = await getPublishedSystemMessageTemplate();

    // Get existing editable content (or use defaults)
    const editableContent: EditableContent = (systemMessage.editableContent as EditableContent) || {};

    // Generate new dynamic message
    let newContent = generateDynamicSystemMessage(
      template,
      features,
      editableContent,
      workflow.demo.businessName
    );

    // Preserve website links section if it exists in the current content
    // (Website links are injected during demo creation, we want to keep them)
    const websiteLinksMatch = systemMessage.content.match(/##\s*Website links \(canonical\)[\s\S]*?(?=\n\n---|\n\n#|\n\n##|$)/i);
    if (websiteLinksMatch) {
      // Check if newContent already has website links
      const hasWebsiteLinks = /##\s*Website links \(canonical\)/i.test(newContent);
      if (!hasWebsiteLinks) {
        // Insert website links after Business Knowledge section
        const kbSectionRegex = /(##\s*Business Knowledge[\s\S]*?)(\n\n---|\n\n#|\n\n##|$)/i;
        const kbMatch = newContent.match(kbSectionRegex);
        if (kbMatch) {
          const kbEndIndex = kbMatch.index! + kbMatch[1].length;
          newContent = newContent.slice(0, kbEndIndex) + '\n\n' + websiteLinksMatch[0] + newContent.slice(kbEndIndex);
        } else {
          // Append at end if no Business Knowledge section
          newContent = newContent + '\n\n' + websiteLinksMatch[0];
        }
      }
    }

    console.log(`📝 Generated system message for workflow ${workflowId}:`);
    console.log(`   - Features: KB=${features.hasKnowledgeBase}, Calendar=${features.hasCalendar}`);
    console.log(`   - Message length: ${newContent.length} characters`);
    console.log(`   - First 200 chars: ${newContent.substring(0, 200)}...`);

    // Update database
    await prisma.systemMessage.update({
      where: { id: message.id },
      data: {
        content: newContent,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // Update file
    const filePath = path.join(
      process.cwd(),
      'public',
      'system_messages',
      `n8n_System_Message_${workflow.demo.slug}.md`
    );
    await fs.writeFile(filePath, newContent, 'utf-8');

    // Update n8n workflow if active
    if (workflow.n8nWorkflowId) {
      try {
        console.log(`🔄 [Regenerate] Updating n8n workflow ${workflow.n8nWorkflowId} with new system message...`);
        console.log(`   - Features: KB=${features.hasKnowledgeBase}, Calendar=${features.hasCalendar}`);
        console.log(`   - Message length: ${newContent.length} chars`);
        const n8nResponse = await updateN8nWorkflowSystemMessage(
          workflow.n8nWorkflowId,
          newContent,
          workflow.demo.businessName
        );
        console.log(`✅ [Regenerate] Successfully updated n8n workflow ${workflow.n8nWorkflowId}`);
        console.log(`   - Workflow name: ${n8nResponse.name}`);
        console.log(`   - Workflow active: ${n8nResponse.active}`);
      } catch (n8nError) {
        console.error(`❌ [Regenerate] Failed to update n8n workflow ${workflow.n8nWorkflowId}:`, n8nError);
        console.error(`   Error details:`, n8nError instanceof Error ? n8nError.message : String(n8nError));
        // Don't throw - file and DB are updated, but log the error for debugging
      }
    } else {
      console.log(`ℹ️ [Regenerate] No n8n workflow ID found for workflow ${workflowId}, skipping n8n update`);
      console.log(`   - This is normal if the workflow hasn't been duplicated in n8n yet`);
    }

    console.log(`✅ System message regenerated for workflow ${workflowId} (features: KB=${features.hasKnowledgeBase}, Calendar=${features.hasCalendar})`);
  } catch (error) {
    console.error(`❌ Error regenerating system message for workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Regenerate system messages for all workflows of a user
 * Called when Calendar integration is enabled/disabled (affects all workflows)
 */
export async function regenerateSystemMessagesForUser(userId: string): Promise<void> {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  try {
    // Get all workflows with features
    const { workflows } = await detectUserFeatures(userId);

    console.log(`🔄 Regenerating system messages for ${workflows.length} workflows...`);

    // Regenerate each workflow
    for (const { workflowId } of workflows) {
      try {
        await regenerateSystemMessageForWorkflow(workflowId);
      } catch (error) {
        console.error(`❌ Failed to regenerate workflow ${workflowId}:`, error);
        // Continue with other workflows
      }
    }

    console.log(`✅ Completed regeneration for ${workflows.length} workflows`);
  } catch (error) {
    console.error(`❌ Error regenerating system messages for user ${userId}:`, error);
    throw error;
  }
}

