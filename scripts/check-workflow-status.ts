#!/usr/bin/env tsx

/**
 * Check current workflow status
 */

import { prisma } from '../lib/prisma';

async function checkWorkflowStatus() {
  try {
    console.log('🔍 Checking sigle.io workflow status...');

    const workflow = await prisma.workflow.findUnique({
      where: {
        id: 'cmgiq1wo9000kif8oqxb507t9'
      },
      include: {
        demo: {
          select: {
            businessName: true,
            slug: true
          }
        }
      }
    });

    if (workflow) {
      console.log('✅ Workflow found:');
      console.log(`📋 Business: ${workflow.demo.businessName}`);
      console.log(`📋 Slug: ${workflow.demo.slug}`);
      console.log(`📋 Status: ${workflow.status}`);
      console.log(`📋 n8n ID: ${workflow.n8nWorkflowId}`);
      console.log(`📋 Created: ${workflow.createdAt}`);
      console.log(`📋 Updated: ${workflow.updatedAt}`);
    } else {
      console.log('❌ Workflow not found');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflowStatus();
