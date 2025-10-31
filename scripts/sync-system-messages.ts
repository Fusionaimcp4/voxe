#!/usr/bin/env tsx

/**
 * Script to check and sync system messages between file system and database
 */

import { PrismaClient } from '../lib/generated/prisma';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncSystemMessages() {
  try {
    console.log('🔍 Checking system messages...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (!user) {
      console.log('❌ User admin@mcp4.ai not found');
      return;
    }

    console.log('✅ User found:', user.email);

    // Get all demos for this user
    const demos = await prisma.demo.findMany({
      where: { userId: user.id }
    });

    console.log(`📊 Found ${demos.length} demos for user`);

    // Get all system messages for this user
    const systemMessages = await prisma.systemMessage.findMany({
      where: {
        demoId: {
          in: demos.map(d => d.id)
        }
      },
      include: {
        demo: {
          select: {
            slug: true,
            businessName: true
          }
        }
      }
    });

    console.log(`📋 Found ${systemMessages.length} system messages in database`);

    // Check system messages folder
    const systemMessagesDir = path.join(process.cwd(), 'public', 'system_messages');
    
    try {
      const files = await fs.readdir(systemMessagesDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      console.log(`📁 Found ${mdFiles.length} system message files in file system`);

      for (const file of mdFiles) {
        const slug = file.replace('n8n_System_Message_', '').replace('.md', '');
        console.log(`\n📄 Checking file: ${file} (slug: ${slug})`);
        
        // Find corresponding demo
        const demo = demos.find(d => d.slug === slug);
        
        if (demo) {
          console.log(`  ✅ Demo found: ${demo.businessName}`);
          
          // Check if system message exists in database
          const existingMessage = systemMessages.find(sm => sm.demoId === demo.id);
          
          if (existingMessage) {
            console.log(`  ✅ System message exists in DB (${existingMessage.id})`);
            
            // Read file content
            const filePath = path.join(systemMessagesDir, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            
            // Update database with file content if different
            if (existingMessage.content !== fileContent) {
              console.log(`  🔄 Updating system message content...`);
              await prisma.systemMessage.update({
                where: { id: existingMessage.id },
                data: { content: fileContent }
              });
              console.log(`  ✅ Updated system message content`);
            } else {
              console.log(`  ✅ Content matches`);
            }
          } else {
            console.log(`  ⚠️  System message missing in DB, creating...`);
            
            // Read file content
            const filePath = path.join(systemMessagesDir, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            
            // Create system message
            const newMessage = await prisma.systemMessage.create({
              data: {
                demoId: demo.id,
                content: fileContent,
                version: 1,
                isActive: true
              }
            });
            
            console.log(`  ✅ Created system message (${newMessage.id})`);
          }
        } else {
          console.log(`  ❌ No demo found for slug: ${slug}`);
        }
      }

    } catch (error) {
      console.log('📁 System messages directory not found:', error.message);
    }

    console.log('\n🎉 System messages sync complete!');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
syncSystemMessages().catch(console.error);
