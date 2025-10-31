#!/usr/bin/env tsx

/**
 * Script to manually add the missing blocksurvey.io demo
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function addMissingBlocksurveyDemo() {
  try {
    console.log('🔍 Looking for user admin@mcp4.ai...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (!user) {
      console.log('❌ User admin@mcp4.ai not found');
      return;
    }

    console.log('✅ User found:', user.email);

    // Check if demo already exists
    const existingDemo = await prisma.demo.findFirst({
      where: {
        OR: [
          { businessName: 'blocksurvey.io demo' },
          { businessName: 'blocksurvey.io' },
          { slug: 'blocksurvey-io-demo' }
        ]
      }
    });

    if (existingDemo) {
      console.log('📋 Demo already exists:', existingDemo.businessName);
      return;
    }

    // Create the missing demo
    console.log('📋 Creating blocksurvey.io demo...');
    
    const demo = await prisma.demo.create({
      data: {
        userId: user.id,
        slug: 'blocksurvey-io-demo',
        businessName: 'blocksurvey.io demo',
        businessUrl: 'https://blocksurvey.io',
        demoUrl: 'http://localhost:3000/demo/blocksurvey-io-demo',
        systemMessageFile: '/system-message/n8n_System_Message_blocksurvey-io-demo',
        chatwootInboxId: 0, // Placeholder
        chatwootWebsiteToken: 'placeholder-token',
        primaryColor: '#7ee787',
        secondaryColor: '#f4a261',
        logoUrl: null
      }
    });

    console.log('✅ Demo created:', demo.id);

    // Create associated workflow
    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        demoId: demo.id,
        n8nWorkflowId: 'doBFhHWq2NmyzWky', // The actual workflow ID from n8n
        status: 'ACTIVE',
        configuration: {
          aiModel: 'gpt-4o-mini',
          confidenceThreshold: 0.8,
          escalationRules: [],
          externalIntegrations: []
        }
      }
    });

    console.log('✅ Workflow created with n8n ID:', workflow.n8nWorkflowId);

    // Create system message
    const systemMessage = await prisma.systemMessage.create({
      data: {
        demoId: demo.id,
        content: '# blocksurvey.io demo AI Support Agent\n\nThis is a placeholder system message for the blocksurvey.io demo.',
        version: 1,
        isActive: true
      }
    });

    console.log('✅ System message created:', systemMessage.id);

    console.log('🎉 blocksurvey.io demo added to database successfully!');
    console.log('📋 Now the n8n callback should work correctly');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingBlocksurveyDemo().catch(console.error);
