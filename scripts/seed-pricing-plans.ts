import { PrismaClient, SubscriptionTier } from '../lib/generated/prisma';

const prisma = new PrismaClient();

const DEFAULT_PRICING_PLANS = [
  {
    tier: 'FREE' as SubscriptionTier,
    name: 'FREE',
    price: 0,
    currency: 'USD',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 Demo',
      '2 Workflows',
      '1 Knowledge Base',
      '10 Documents',
      '1 Integration',
      'Community Support',
      '1,000 API calls/month'
    ],
    isPopular: false,
    ctaText: 'Get Started',
    ctaHref: '/dashboard/userdemo'
  },
  {
    tier: 'PRO' as SubscriptionTier,
    name: 'PRO',
    price: 29,
    currency: 'USD',
    period: 'month',
    description: 'For growing businesses',
    features: [
      '5 Demos',
      '10 Workflows',
      '5 Knowledge Bases',
      '100 Documents',
      '3 Integrations',
      'Email Support',
      '10,000 API calls/month',
      'Advanced Analytics',
      'Custom Branding',
      'Priority Support'
    ],
    isPopular: true,
    ctaText: 'Start Pro Trial',
    ctaHref: '/pricing/pro'
  },
  {
    tier: 'PRO_PLUS' as SubscriptionTier,
    name: 'PRO+',
    price: 99,
    currency: 'USD',
    period: 'month',
    description: 'For scaling teams',
    features: [
      '25 Demos',
      '50 Workflows',
      '25 Knowledge Bases',
      '1,000 Documents',
      '10 Integrations',
      'Priority Support',
      '100,000 API calls/month',
      'White Label',
      'SSO Integration',
      'API Access',
      'Webhook Integrations'
    ],
    isPopular: false,
    ctaText: 'Start Pro+ Trial',
    ctaHref: '/pricing/pro-plus'
  },
  {
    tier: 'ENTERPRISE' as SubscriptionTier,
    name: 'ENTERPRISE',
    price: 0, // Custom pricing
    currency: 'USD',
    period: 'contact us',
    description: 'For large organizations',
    features: [
      'Unlimited Demos',
      'Unlimited Workflows',
      'Unlimited Knowledge Bases',
      'Unlimited Documents',
      'Unlimited Integrations',
      'Dedicated Support',
      'Unlimited API calls',
      'Custom Integrations',
      'SLA Guarantees',
      'On-premise Deployment'
    ],
    isPopular: false,
    ctaText: 'Contact Sales',
    ctaHref: '/contact'
  }
];

async function seedPricingPlans() {
  console.log('🌱 Seeding pricing plans...');

  for (const plan of DEFAULT_PRICING_PLANS) {
    await prisma.pricingPlan.upsert({
      where: { tier: plan.tier },
      update: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        period: plan.period,
        description: plan.description,
        features: plan.features,
        isPopular: plan.isPopular,
        ctaText: plan.ctaText,
        ctaHref: plan.ctaHref,
        updatedAt: new Date(),
      },
      create: {
        tier: plan.tier,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        period: plan.period,
        description: plan.description,
        features: plan.features,
        isPopular: plan.isPopular,
        ctaText: plan.ctaText,
        ctaHref: plan.ctaHref,
      },
    });
    console.log(`✅ Created pricing plan for ${plan.tier}`);
  }

  console.log('🎉 Pricing plans seeded successfully!');
}

seedPricingPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
