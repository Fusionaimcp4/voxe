#!/usr/bin/env tsx

/**
 * Migration script to convert existing JSON registry to database
 * This script reads the existing demos.json file and creates database records
 */

import { PrismaClient } from '../lib/generated/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface LegacyDemo {
  slug: string;
  business: string;
  url: string;
  system_message_file: string;
  demo_url: string;
  chatwoot: {
    inbox_id: number;
    website_token: string;
  };
  workflow_duplication?: string;
  agent_bot?: {
    id: number;
    access_token: string;
  };
  lead?: {
    name: string;
    email: string;
    company: string;
    phone?: string;
  };
  created_at: string;
  updated_at?: string;
}

async function migrateDemos() {
  try {
    console.log('🔄 Starting demo migration...');

    // Read existing demos.json
    const demosPath = join(process.cwd(), 'data', 'registry', 'demos.json');
    const demosData = JSON.parse(readFileSync(demosPath, 'utf8'));

    console.log(`📊 Found ${Object.keys(demosData).length} demos to migrate`);

    // Create a default admin user for existing demos
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@localboxs.com' },
      update: {},
      create: {
        email: 'admin@localboxs.com',
        name: 'System Admin',
        company: 'LocalBox',
        role: 'SUPER_ADMIN',
        password: null, // Will be set separately
      },
    });

    console.log(`👤 Created/updated admin user: ${adminUser.email}`);

    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each demo
    for (const [slug, demo] of Object.entries(demosData)) {
      try {
        const legacyDemo = demo as LegacyDemo;

        // Create demo record
        const newDemo = await prisma.demo.create({
          data: {
            slug: legacyDemo.slug,
            businessName: legacyDemo.business,
            businessUrl: legacyDemo.url,
            systemMessageFile: legacyDemo.system_message_file,
            demoUrl: legacyDemo.demo_url,
            chatwootInboxId: legacyDemo.chatwoot.inbox_id,
            chatwootWebsiteToken: legacyDemo.chatwoot.website_token,
            userId: adminUser.id,
            createdAt: new Date(legacyDemo.created_at),
            updatedAt: legacyDemo.updated_at ? new Date(legacyDemo.updated_at) : new Date(legacyDemo.created_at),
          },
        });

        // Create workflow record if agent bot exists
        if (legacyDemo.agent_bot) {
          await prisma.workflow.create({
            data: {
              demoId: newDemo.id,
              userId: adminUser.id,
              status: legacyDemo.workflow_duplication === 'success' ? 'ACTIVE' : 'INACTIVE',
              configuration: {
                agentBot: legacyDemo.agent_bot,
                workflowDuplication: legacyDemo.workflow_duplication,
              },
            },
          });
        }

        // Create contact record if lead exists
        if (legacyDemo.lead) {
          await prisma.contact.create({
            data: {
              demoId: newDemo.id,
              name: legacyDemo.lead.name,
              email: legacyDemo.lead.email,
              company: legacyDemo.lead.company,
              phone: legacyDemo.lead.phone,
            },
          });
        }

        migratedCount++;
        console.log(`✅ Migrated demo: ${slug}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate demo ${slug}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migratedCount} demos`);
    console.log(`❌ Failed migrations: ${errorCount}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateDemos().catch(console.error);
