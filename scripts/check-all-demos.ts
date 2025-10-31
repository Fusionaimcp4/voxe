#!/usr/bin/env tsx

/**
 * Script to check all demos in the database
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkAllDemos() {
  try {
    console.log('🔍 Checking all demos in database...');

    // Get all demos from database (not filtered by user)
    const allDemos = await prisma.demo.findMany({
      orderBy: { slug: 'asc' }
    });

    console.log(`📊 Found ${allDemos.length} total demos in database:`);
    allDemos.forEach(demo => {
      console.log(`  - ${demo.slug} (${demo.businessName}) - User: ${demo.userId}`);
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (user) {
      console.log(`\n👤 User admin@mcp4.ai ID: ${user.id}`);
      
      const userDemos = allDemos.filter(demo => demo.userId === user.id);
      console.log(`📊 User has ${userDemos.length} demos:`);
      userDemos.forEach(demo => {
        console.log(`  - ${demo.slug} (${demo.businessName})`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAllDemos().catch(console.error);
