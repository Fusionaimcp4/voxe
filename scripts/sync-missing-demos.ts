#!/usr/bin/env tsx

/**
 * Script to check for missing demos and add them to the database
 */

import { PrismaClient } from '../lib/generated/prisma';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkAndAddMissingDemos() {
  try {
    console.log('🔍 Checking for missing demos...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (!user) {
      console.log('❌ User admin@mcp4.ai not found');
      return;
    }

    console.log('✅ User found:', user.email);

    // Get all demos from database
    const dbDemos = await prisma.demo.findMany({
      where: { userId: user.id }
    });

    console.log(`📊 Found ${dbDemos.length} demos in database`);

    // Check demos folder for missing entries
    const demosDir = path.join(process.cwd(), 'public', 'demos');
    
    try {
      const demoFolders = await fs.readdir(demosDir);
      console.log(`📁 Found ${demoFolders.length} demo folders in file system`);

      for (const folder of demoFolders) {
        // Check if this demo exists in database
        const existsInDb = dbDemos.some(demo => demo.slug === folder);
        
        if (!existsInDb) {
          console.log(`⚠️  Missing demo: ${folder}`);
          
          // Try to extract business name from folder name
          let businessName = folder.replace(/-[a-f0-9]{8}$/, '').replace(/-/g, ' ');
          let businessUrl = `https://${businessName.replace(/\s+/g, '')}.com`;
          
          // Handle specific cases
          if (folder === 'fin-ai-8da80263') {
            businessName = 'Fin AI';
            businessUrl = 'https://fin.ai';
          } else if (folder === 'sostwork') {
            businessName = 'Sost Work';
            businessUrl = 'https://sost.work';
          } else if (folder === 'ayate3000') {
            businessName = 'Ayate 3000';
            businessUrl = 'https://ayate3000.com';
          } else if (folder === 'bittensor') {
            businessName = 'Bittensor';
            businessUrl = 'https://bittensor.com';
          } else if (folder === 'fusion') {
            businessName = 'Fusion';
            businessUrl = 'https://fusion.com';
          }
          
          // Create the missing demo
          const demo = await prisma.demo.create({
            data: {
              userId: user.id,
              slug: folder,
              businessName: businessName,
              businessUrl: businessUrl,
              demoUrl: `http://localhost:3000/demo/${folder}`,
              systemMessageFile: `/system-message/n8n_System_Message_${folder}`,
              chatwootInboxId: 0,
              chatwootWebsiteToken: 'placeholder-token',
              primaryColor: '#7ee787',
              secondaryColor: '#f4a261',
              logoUrl: null
            }
          });

          console.log(`✅ Added missing demo: ${folder} (${demo.id})`);

          // Create associated workflow
          await prisma.workflow.create({
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

          // Create system message
          await prisma.systemMessage.create({
            data: {
              demoId: demo.id,
              content: `# ${businessName} AI Support Agent\n\nThis is a placeholder system message for the ${businessName} demo.`,
              version: 1,
              isActive: true
            }
          });
        } else {
          console.log(`✅ Demo exists in DB: ${folder}`);
        }
      }

    } catch (error) {
      console.log('📁 Demos directory not found or empty:', error.message);
    }

    console.log('🎉 Check complete!');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAndAddMissingDemos().catch(console.error);
