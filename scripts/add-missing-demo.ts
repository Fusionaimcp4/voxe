#!/usr/bin/env tsx

/**
 * Script to manually add the missing plex-tv demo to the database
 */

import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addMissingDemo() {
  try {
    console.log('🔍 Looking for user admin@mcp4.ai...');

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (!user) {
      console.log('👤 Creating user admin@mcp4.ai...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      user = await prisma.user.create({
        data: {
          email: 'admin@mcp4.ai',
          name: 'yilak kidane',
          company: 'mpc4',
          password: hashedPassword,
          role: 'USER'
        }
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ User found:', user.id);
    }

    // Check if demo already exists
    const existingDemo = await prisma.demo.findFirst({
      where: {
        OR: [
          { slug: 'plex-tv-5a608c21' },
          { demoUrl: 'http://localhost:3000/demo/plex-tv-5a608c21' }
        ]
      }
    });

    if (existingDemo) {
      console.log('📋 Demo already exists:', existingDemo.id);
      return;
    }

    // Create the missing demo
    console.log('📋 Creating plex-tv demo...');
    
    const demo = await prisma.demo.create({
      data: {
        userId: user.id,
        slug: 'plex-tv-5a608c21',
        businessName: 'Plex TV',
        businessUrl: 'https://plex.tv',
        demoUrl: 'http://localhost:3000/demo/plex-tv-5a608c21',
        systemMessageFile: '/system-message/n8n_System_Message_plex-tv-5a608c21',
        chatwootInboxId: 0, // Placeholder
        chatwootWebsiteToken: 'placeholder-token',
        configuration: {
          primaryColor: '#7ee787',
          secondaryColor: '#f4a261',
          logoUrl: null,
          canonicalUrls: []
        }
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
        content: '# Plex TV AI Support Agent\n\nThis is a placeholder system message for the Plex TV demo.',
        version: 1,
        isActive: true
      }
    });

    console.log('✅ System message created:', systemMessage.id);

    console.log('🎉 All records created successfully!');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addMissingDemo().catch(console.error);
