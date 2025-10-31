#!/usr/bin/env tsx

/**
 * Script to add the missing fin-ai demo to the database
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function addFinAiDemo() {
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
          { slug: 'fin-ai-8da80263' },
          { demoUrl: 'http://localhost:3000/demo/fin-ai-8da80263' }
        ]
      }
    });

    if (existingDemo) {
      console.log('📋 Demo already exists:', existingDemo.id);
      return;
    }

    // Create the missing demo
    console.log('📋 Creating fin-ai demo...');
    
    const demo = await prisma.demo.create({
      data: {
        userId: user.id,
        slug: 'fin-ai-8da80263',
        businessName: 'Fin AI',
        businessUrl: 'https://fin.ai',
        demoUrl: 'http://localhost:3000/demo/fin-ai-8da80263',
        systemMessageFile: '/system-message/n8n_System_Message_fin-ai-8da80263',
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
        status: 'ACTIVE',
        configuration: {
          aiModel: 'gpt-4o-mini',
          confidenceThreshold: 0.8,
          escalationRules: [],
          externalIntegrations: []
        }
      }
    });

    console.log('✅ Workflow created:', workflow.id);

    // Create system message
    const systemMessage = await prisma.systemMessage.create({
      data: {
        demoId: demo.id,
        content: '# Fin AI Support Agent\n\nThis is a placeholder system message for the Fin AI demo.',
        version: 1,
        isActive: true
      }
    });

    console.log('✅ System message created:', systemMessage.id);

    console.log('🎉 Fin AI demo added to database successfully!');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addFinAiDemo().catch(console.error);
