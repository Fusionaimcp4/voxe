import { PrismaClient } from '../lib/generated/prisma';
import { FEATURE_DEFINITIONS } from '../lib/features';

const prisma = new PrismaClient();

async function seedFeatures() {
  console.log('🌱 Seeding features...');

  try {
    // Clear existing features
    await prisma.userFeature.deleteMany();
    await prisma.feature.deleteMany();

    // Create features
    for (const featureDef of FEATURE_DEFINITIONS) {
      await prisma.feature.create({
        data: {
          name: featureDef.name,
          description: featureDef.description,
          tier: featureDef.tier,
          isActive: true
        }
      });
      console.log(`✅ Created feature: ${featureDef.name} (${featureDef.tier})`);
    }

    // Grant features to users based on their current tier
    const users = await prisma.user.findMany({
      select: {
        id: true,
        subscriptionTier: true
      }
    });

    for (const user of users) {
      const userFeatures = FEATURE_DEFINITIONS.filter(
        feature => feature.tier === user.subscriptionTier
      );

      for (const featureDef of userFeatures) {
        const feature = await prisma.feature.findUnique({
          where: { name: featureDef.name }
        });

        if (feature) {
          await prisma.userFeature.create({
            data: {
              userId: user.id,
              featureId: feature.id
            }
          });
        }
      }
      console.log(`✅ Granted ${userFeatures.length} features to user ${user.id} (${user.subscriptionTier})`);
    }

    console.log('🎉 Features seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding features:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedFeatures()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export default seedFeatures;
