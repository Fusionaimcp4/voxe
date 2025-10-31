#!/usr/bin/env tsx

/**
 * Script to check what demos exist in the database
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkDemos() {
  try {
    console.log('🔍 Checking all demos in database...');

    // Get all demos
    const demos = await prisma.demo.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 Found ${demos.length} recent demos:`);
    demos.forEach((demo, index) => {
      console.log(`${index + 1}. ${demo.businessName} (${demo.slug})`);
      console.log(`   Created: ${demo.createdAt.toISOString()}`);
      console.log(`   URL: ${demo.businessUrl}`);
      console.log('');
    });

    // Check specifically for blocksurvey
    const blocksurveyDemos = await prisma.demo.findMany({
      where: {
        businessName: {
          contains: 'blocksurvey'
        }
      }
    });

    console.log(`🔍 Blocksurvey-related demos: ${blocksurveyDemos.length}`);
    blocksurveyDemos.forEach(demo => {
      console.log(`- "${demo.businessName}" (${demo.slug})`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDemos().catch(console.error);
