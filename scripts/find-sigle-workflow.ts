#!/usr/bin/env tsx

/**
 * Script to find the database workflow ID for sigle.io
 */

import { prisma } from '../lib/prisma';

async function findSigleWorkflow() {
  try {
    console.log('🔍 Finding sigle.io workflow in database...');

    // Find the demo first
    const demo = await prisma.demo.findFirst({
      where: {
        OR: [
          { businessName: 'sigle.io' },
          { slug: 'sigle-io-7b4d2912' },
          { businessName: { contains: 'sigle', mode: 'insensitive' } }
        ]
      },
      include: {
        workflows: {
          include: {
            demo: {
              select: {
                businessName: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (demo) {
      console.log('✅ Found demo:', demo.businessName);
      console.log('📋 Demo ID:', demo.id);
      console.log('📋 Slug:', demo.slug);
      console.log('📋 Business URL:', demo.businessUrl);
      
      if (demo.workflows.length > 0) {
        console.log('\n📋 Associated workflows:');
        demo.workflows.forEach((workflow, index) => {
          console.log(`${index + 1}. Workflow ID: ${workflow.id}`);
          console.log(`   n8n Workflow ID: ${workflow.n8nWorkflowId || 'Not set'}`);
          console.log(`   Status: ${workflow.status}`);
          console.log(`   Created: ${workflow.createdAt}`);
        });
      } else {
        console.log('⚠️ No workflows found for this demo');
      }
    } else {
      console.log('❌ Demo not found');
      
      // List all demos to help debug
      console.log('\n📋 All demos in database:');
      const allDemos = await prisma.demo.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          slug: true,
          createdAt: true
        }
      });
      
      allDemos.forEach((demo, index) => {
        console.log(`${index + 1}. ${demo.businessName} (${demo.slug}) - ${demo.createdAt.toISOString()}`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSigleWorkflow();
