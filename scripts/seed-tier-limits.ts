import { PrismaClient } from '@/lib/generated/prisma';
import { SubscriptionTier } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

const defaultTierLimits = {
  FREE: {
    maxDemos: 1,
    maxWorkflows: 2,
    maxKnowledgeBases: 1,
    maxDocuments: 10,
    maxIntegrations: 1,
    apiCallsPerMonth: 1000,
    documentSizeLimit: 5 * 1024 * 1024, // 5MB
    chunkSize: 1000,
    maxChunksPerDocument: 50
  },
  PRO: {
    maxDemos: 5,
    maxWorkflows: 10,
    maxKnowledgeBases: 5,
    maxDocuments: 100,
    maxIntegrations: 3,
    apiCallsPerMonth: 10000,
    documentSizeLimit: 25 * 1024 * 1024, // 25MB
    chunkSize: 2000,
    maxChunksPerDocument: 200
  },
  PRO_PLUS: {
    maxDemos: 25,
    maxWorkflows: 50,
    maxKnowledgeBases: 25,
    maxDocuments: 1000,
    maxIntegrations: 10,
    apiCallsPerMonth: 100000,
    documentSizeLimit: 100 * 1024 * 1024, // 100MB
    chunkSize: 4000,
    maxChunksPerDocument: 1000
  },
  ENTERPRISE: {
    maxDemos: -1, // Unlimited
    maxWorkflows: -1,
    maxKnowledgeBases: -1,
    maxDocuments: -1,
    maxIntegrations: -1,
    apiCallsPerMonth: -1,
    documentSizeLimit: 500 * 1024 * 1024, // 500MB
    chunkSize: 8000,
    maxChunksPerDocument: -1
  }
};

async function seedTierLimits() {
  console.log('🌱 Seeding tier limits...');

  try {
    // Clear existing tier limits
    await prisma.tierLimit.deleteMany();

    // Create tier limits for each tier
    for (const [tier, limits] of Object.entries(defaultTierLimits)) {
      await prisma.tierLimit.create({
        data: {
          tier: tier as SubscriptionTier,
          ...limits
        }
      });
      console.log(`✅ Created tier limits for ${tier}`);
    }

    console.log('🎉 Tier limits seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding tier limits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedTierLimits()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export default seedTierLimits;
