import { SubscriptionTier } from './generated/prisma';

// Feature Matrix - Defines what each tier can access
export const FEATURE_MATRIX = {
  FREE: {
    maxDemos: 1,
    maxWorkflows: 2,
    maxKnowledgeBases: 1,
    maxDocuments: 10,
    maxIntegrations: 1,
    maxHelpdeskAgents: 1,
    integrations: ['CRM'],
    supportLevel: 'community',
    apiCallsPerMonth: 1000,
    features: [],
    limits: {
      documentSize: 5 * 1024 * 1024, // 5MB
      chunkSize: 1000,
      maxChunksPerDocument: 50
    }
  },
  STARTER: {
    maxDemos: 2,
    maxWorkflows: 5,
    maxKnowledgeBases: 2,
    maxDocuments: 50,
    maxIntegrations: 2,
    maxHelpdeskAgents: 2,
    integrations: ['CRM', 'Calendar'],
    supportLevel: 'email',
    apiCallsPerMonth: 5000,
    features: [],
    limits: {
      documentSize: 10 * 1024 * 1024, // 10MB
      chunkSize: 1500,
      maxChunksPerDocument: 100
    }
  },
  TEAM: {
    maxDemos: 5,
    maxWorkflows: 10,
    maxKnowledgeBases: 5,
    maxDocuments: 100,
    maxIntegrations: 3,
    maxHelpdeskAgents: 3,
    integrations: ['CRM', 'Calendar', 'Database'],
    supportLevel: 'email',
    apiCallsPerMonth: 10000,
    features: ['advanced_analytics', 'custom_branding', 'priority_support'],
    limits: {
      documentSize: 25 * 1024 * 1024, // 25MB
      chunkSize: 2000,
      maxChunksPerDocument: 200
    }
  },
  BUSINESS: {
    maxDemos: 25,
    maxWorkflows: 50,
    maxKnowledgeBases: 25,
    maxDocuments: 1000,
    maxIntegrations: 10,
    maxHelpdeskAgents: 5,
    integrations: ['CRM', 'Calendar', 'Database', 'API', 'Webhook'],
    supportLevel: 'priority',
    apiCallsPerMonth: 100000,
    features: ['advanced_analytics', 'custom_branding', 'white_label', 'sso', 'api_access', 'webhook_integrations'],
    limits: {
      documentSize: 100 * 1024 * 1024, // 100MB
      chunkSize: 4000,
      maxChunksPerDocument: 1000
    }
  },
  ENTERPRISE: {
    maxDemos: -1, // Unlimited
    maxWorkflows: -1, // Unlimited
    maxKnowledgeBases: -1, // Unlimited
    maxDocuments: -1, // Unlimited
    maxIntegrations: -1, // Unlimited
    maxHelpdeskAgents: -1, // Unlimited
    integrations: ['CRM', 'Calendar', 'Database', 'API', 'Webhook', 'Custom'],
    supportLevel: 'dedicated',
    apiCallsPerMonth: -1, // Unlimited
    features: ['advanced_analytics', 'custom_branding', 'white_label', 'sso', 'api_access', 'webhook_integrations', 'custom_integrations', 'dedicated_support', 'sla'],
    limits: {
      documentSize: 500 * 1024 * 1024, // 500MB
      chunkSize: 8000,
      maxChunksPerDocument: -1 // Unlimited
    }
  }
} as const;

// Feature definitions for database seeding
export const FEATURE_DEFINITIONS = [
  // FREE tier features (basic functionality)
  {
    name: 'basic_demos',
    description: 'Create and manage basic demos',
    tier: 'FREE' as SubscriptionTier
  },
  {
    name: 'basic_workflows',
    description: 'Create and manage basic workflows',
    tier: 'FREE' as SubscriptionTier
  },
  {
    name: 'basic_knowledge_bases',
    description: 'Create and manage basic knowledge bases',
    tier: 'FREE' as SubscriptionTier
  },
  {
    name: 'crm_integration',
    description: 'Connect with CRM systems',
    tier: 'FREE' as SubscriptionTier
  },

  // STARTER tier features
  {
    name: 'more_demos',
    description: 'Create and manage more demos',
    tier: 'STARTER' as SubscriptionTier
  },
  {
    name: 'more_workflows',
    description: 'Create and manage more workflows',
    tier: 'STARTER' as SubscriptionTier
  },
  {
    name: 'more_knowledge_bases',
    description: 'Create and manage more knowledge bases',
    tier: 'STARTER' as SubscriptionTier
  },
  {
    name: 'calendar_integration_starter',
    description: 'Basic calendar and scheduling integrations',
    tier: 'STARTER' as SubscriptionTier
  },

  // TEAM tier features (formerly PRO)
  {
    name: 'advanced_analytics',
    description: 'Access to advanced analytics and reporting',
    tier: 'TEAM' as SubscriptionTier
  },
  {
    name: 'custom_branding',
    description: 'Custom branding and theming options',
    tier: 'TEAM' as SubscriptionTier
  },
  {
    name: 'priority_support',
    description: 'Priority email support',
    tier: 'TEAM' as SubscriptionTier
  },
  {
    name: 'calendar_integration',
    description: 'Calendar and scheduling integrations',
    tier: 'TEAM' as SubscriptionTier
  },
  {
    name: 'database_integration',
    description: 'Database and data source integrations',
    tier: 'TEAM' as SubscriptionTier
  },

  // BUSINESS tier features (formerly PRO_PLUS)
  {
    name: 'white_label',
    description: 'White-label solution with custom domain',
    tier: 'BUSINESS' as SubscriptionTier
  },
  {
    name: 'sso',
    description: 'Single Sign-On (SSO) integration',
    tier: 'BUSINESS' as SubscriptionTier
  },
  {
    name: 'api_access',
    description: 'Full API access and custom integrations',
    tier: 'BUSINESS' as SubscriptionTier
  },
  {
    name: 'webhook_integrations',
    description: 'Webhook and real-time integrations',
    tier: 'BUSINESS' as SubscriptionTier
  },

  // ENTERPRISE tier features
  {
    name: 'custom_integrations',
    description: 'Custom integration development',
    tier: 'ENTERPRISE' as SubscriptionTier
  },
  {
    name: 'dedicated_support',
    description: 'Dedicated account manager and support',
    tier: 'ENTERPRISE' as SubscriptionTier
  },
  {
    name: 'sla',
    description: 'Service Level Agreement guarantees',
    tier: 'ENTERPRISE' as SubscriptionTier
  }
];

// Helper functions for feature checking
export function getTierLimits(tier: SubscriptionTier) {
  return FEATURE_MATRIX[tier];
}

export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  const limits = getTierLimits(tier);
  return (limits.features as unknown as string[]).includes(feature);
}

export function canAccessFeature(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierOrder = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}

export function getUpgradePrompt(currentTier: SubscriptionTier, feature: string): string {
  const tierOrder = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  // Find the minimum tier that has this feature
  let requiredTier = 'ENTERPRISE';
  for (const tier of tierOrder) {
    if (hasFeature(tier as SubscriptionTier, feature)) {
      requiredTier = tier;
      break;
    }
  }
  
  return `This feature requires ${requiredTier} tier or higher. Upgrade to unlock ${feature}.`;
}

// Usage tracking helpers
export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // Unlimited
  return current < limit;
}

export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  return Math.min((current / limit) * 100, 100);
}

export function getUsageStatus(current: number, limit: number): 'safe' | 'warning' | 'critical' {
  if (limit === -1) return 'safe'; // Unlimited
  
  const percentage = getUsagePercentage(current, limit);
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'safe';
}
