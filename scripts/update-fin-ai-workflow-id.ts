#!/usr/bin/env tsx

/**
 * Script to update the Fin AI demo with the correct n8n workflow ID
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function updateFinAiWorkflowId() {
  try {
    console.log('🔍 Looking for Fin AI demo...');

    // Find the Fin AI demo
    const demo = await prisma.demo.findFirst({
      where: {
        slug: 'fin-ai-8da80263'
      },
      include: {
        workflows: true
      }
    });

    if (!demo) {
      console.log('❌ Fin AI demo not found');
      return;
    }

    console.log('✅ Fin AI demo found:', demo.id);

    // Update the workflow with the correct n8n workflow ID
    const workflowId = 'CUJrjaBvJYDFVJNP'; // The workflow ID you provided
    
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: demo.workflows[0].id },
      data: {
        n8nWorkflowId: workflowId
      }
    });

    console.log('✅ Workflow updated with n8n ID:', workflowId);
    console.log('📋 Workflow details:', {
      id: updatedWorkflow.id,
      n8nWorkflowId: updatedWorkflow.n8nWorkflowId,
      status: updatedWorkflow.status
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateFinAiWorkflowId().catch(console.error);
