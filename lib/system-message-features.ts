/**
 * Feature Detection for System Messages
 * Detects which features are enabled for a workflow to determine which sections to include
 */

import { prisma } from '@/lib/prisma';
import { WorkflowFeatures } from './system-message-sections';

/**
 * Detect enabled features for a workflow
 */
export async function detectWorkflowFeatures(workflowId: string): Promise<WorkflowFeatures> {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  // Get workflow with user info
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      userId: true,
      knowledgeBases: {
        where: { isActive: true },
        select: { id: true }
      }
    }
  });

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Check if workflow has linked KBs
  const hasKnowledgeBase = workflow.knowledgeBases.length > 0;

  // Check if user has active calendar integration
  const calendarIntegration = await prisma.integration.findFirst({
    where: {
      userId: workflow.userId,
      type: 'CALENDAR',
      isActive: true
    }
  });

  const hasCalendar = !!calendarIntegration;

  return {
    hasKnowledgeBase,
    hasCalendar
  };
}

/**
 * Detect enabled features for all workflows of a user
 * Used when regenerating messages after feature changes
 */
export async function detectUserFeatures(userId: string): Promise<{
  workflows: Array<{ workflowId: string; features: WorkflowFeatures }>;
}> {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }

  // Get all workflows for user
  const workflows = await prisma.workflow.findMany({
    where: {
      userId,
      n8nWorkflowId: { not: null }
    },
    select: {
      id: true,
      knowledgeBases: {
        where: { isActive: true },
        select: { id: true }
      }
    }
  });

  // Check calendar integration once for user
  const calendarIntegration = await prisma.integration.findFirst({
    where: {
      userId,
      type: 'CALENDAR',
      isActive: true
    }
  });

  const hasCalendar = !!calendarIntegration;

  // Map workflows to their features
  const workflowsWithFeatures = workflows.map(workflow => ({
    workflowId: workflow.id,
    features: {
      hasKnowledgeBase: workflow.knowledgeBases.length > 0,
      hasCalendar
    } as WorkflowFeatures
  }));

  return {
    workflows: workflowsWithFeatures
  };
}

