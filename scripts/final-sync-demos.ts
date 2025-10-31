#!/usr/bin/env tsx

/**
 * Script to check current database state and add only truly missing demos
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking current database state...');

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

    console.log(`📊 Found ${dbDemos.length} demos in database:`);
    dbDemos.forEach(demo => {
      console.log(`  - ${demo.slug} (${demo.businessName})`);
    });

    // Check which demos are missing
    const fileSystemDemos = ['ayate3000', 'bittensor', 'fin-ai-8da80263', 'fusion', 'sostwork'];
    const missingDemos = fileSystemDemos.filter(fsDemo => 
      !dbDemos.some(dbDemo => dbDemo.slug === fsDemo)
    );

    console.log(`\n⚠️  Missing demos: ${missingDemos.length}`);
    missingDemos.forEach(demo => console.log(`  - ${demo}`));

    if (missingDemos.length > 0) {
      console.log('\n📋 Adding missing demos...');
      
      for (const slug of missingDemos) {
        let businessName = slug.replace(/-[a-f0-9]{8}$/, '').replace(/-/g, ' ');
        let businessUrl = `https://${businessName.replace(/\s+/g, '')}.com`;
        
        // Handle specific cases
        if (slug === 'fin-ai-8da80263') {
          businessName = 'Fin AI';
          businessUrl = 'https://fin.ai';
        } else if (slug === 'sostwork') {
          businessName = 'Sost Work';
          businessUrl = 'https://sost.work';
        } else if (slug === 'ayate3000') {
          businessName = 'Ayate 3000';
          businessUrl = 'https://ayate3000.com';
        } else if (slug === 'bittensor') {
          businessName = 'Bittensor';
          businessUrl = 'https://bittensor.com';
        } else if (slug === 'fusion') {
          businessName = 'Fusion';
          businessUrl = 'https://fusion.com';
        }
        
        try {
          const demo = await prisma.demo.create({
            data: {
              userId: user.id,
              slug: slug,
              businessName: businessName,
              businessUrl: businessUrl,
              demoUrl: `http://localhost:3000/demo/${slug}`,
              systemMessageFile: `/system-message/n8n_System_Message_${slug}`,
              chatwootInboxId: 0,
              chatwootWebsiteToken: 'placeholder-token',
              primaryColor: '#7ee787',
              secondaryColor: '#f4a261',
              logoUrl: null
            }
          });

          console.log(`✅ Added: ${slug} (${demo.id})`);

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

        } catch (error) {
          console.log(`❌ Failed to add ${slug}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Database sync complete!');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabaseState().catch(console.error);
