#!/usr/bin/env tsx

/**
 * Script to update admin user password with proper bcrypt hash
 */

import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('🔄 Updating admin password...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@localboxs.com' },
      data: {
        password: hashedPassword,
      },
    });

    console.log('✅ Admin password updated successfully!');
    console.log(`📧 Email: admin@localboxs.com`);
    console.log(`🔑 Password: admin123`);
    console.log(`🆔 User ID: ${updatedUser.id}`);
    console.log(`👑 Role: ${updatedUser.role}`);

  } catch (error) {
    console.error('💥 Failed to update admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateAdminPassword().catch(console.error);
