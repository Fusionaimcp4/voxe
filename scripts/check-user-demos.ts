#!/usr/bin/env tsx

/**
 * Script to check user and demos in database
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkUserAndDemos() {
  try {
    console.log('🔍 Checking user admin@mcp4.ai...');

    const user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (!user) {
      console.log('❌ User admin@mcp4.ai not found in database');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    const demos = await prisma.demo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 User has ${demos.length} demos:`);
    
    demos.forEach((demo, index) => {
      console.log(`${index + 1}. ${demo.businessName} (${demo.slug})`);
      console.log(`   URL: ${demo.demoUrl}`);
      console.log(`   Created: ${demo.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkUserAndDemos().catch(console.error);
