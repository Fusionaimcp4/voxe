#!/usr/bin/env tsx

/**
 * Script to create an admin user for the Voxe system
 */

import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@mcp4.ai',
        name: 'System Admin',
        company: process.env.APP_NAME || 'Voxe',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: admin@mcp4.ai`);
    console.log(`🔑 Password: admin123`);
    console.log(`🆔 User ID: ${adminUser.id}`);
    console.log(`👑 Role: ${adminUser.role}`);

    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('💥 Failed to create admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser().catch(console.error);
