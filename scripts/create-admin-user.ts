#!/usr/bin/env tsx

/**
 * Script to create an admin user for the LocalBox system
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
      where: { email: 'admin@localboxs.com' }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@localboxs.com',
        name: 'System Admin',
        company: 'LocalBox',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: admin@localboxs.com`);
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
