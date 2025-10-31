import { SubscriptionTier } from './generated/prisma';
import { getTierLimits, canAccessFeature } from './features';

// Tier-based access control utilities
export function checkTierAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return canAccessFeature(userTier, requiredTier);
}

export function getTierRestrictions(userTier: SubscriptionTier) {
  return getTierLimits(userTier);
}

// Route-based tier requirements
export const TIER_REQUIREMENTS = {
  // Basic dashboard access - FREE tier
  '/dashboard': 'FREE',
  '/dashboard/workflows': 'FREE',
  '/dashboard/knowledge-bases': 'FREE',
  '/dashboard/system-messages': 'FREE',
  '/dashboard/demos': 'FREE',
  '/dashboard/integrations': 'FREE',
  
  // Advanced features - PRO tier
  '/dashboard/analytics': 'PRO',
  '/dashboard/branding': 'PRO',
  '/dashboard/api-keys': 'PRO',
  
  // Enterprise features - PRO_PLUS tier
  '/dashboard/white-label': 'PRO_PLUS',
  '/dashboard/sso': 'PRO_PLUS',
  '/dashboard/webhooks': 'PRO_PLUS',
  
  // Admin features - ADMIN role (not tier-based)
  '/admin': 'ADMIN_ROLE',
} as const;

// API route tier requirements
export const API_TIER_REQUIREMENTS = {
  // Basic APIs - FREE tier
  '/api/dashboard/workflows': 'FREE',
  '/api/dashboard/knowledge-bases': 'FREE',
  '/api/dashboard/demos': 'FREE',
  '/api/dashboard/integrations': 'FREE',
  
  // Advanced APIs - PRO tier
  '/api/dashboard/analytics': 'PRO',
  '/api/dashboard/branding': 'PRO',
  '/api/dashboard/api-keys': 'PRO',
  
  // Enterprise APIs - PRO_PLUS tier
  '/api/dashboard/webhooks': 'PRO_PLUS',
  '/api/dashboard/sso': 'PRO_PLUS',
  
  // Admin APIs - ADMIN role
  '/api/admin': 'ADMIN_ROLE',
} as const;

// Usage tracking for tier limits
export interface UsageStats {
  demos: number;
  workflows: number;
  knowledgeBases: number;
  documents: number;
  integrations: number;
  helpdeskAgents: number;
  apiCalls: number;
}

// Check if user has exceeded tier limits
export function checkUsageLimits(userTier: SubscriptionTier, usage: UsageStats): {
  allowed: boolean;
  exceeded: string[];
  warnings: string[];
} {
  const limits = getTierLimits(userTier);
  const exceeded: string[] = [];
  const warnings: string[] = [];

  // Check each limit
  if (limits.maxDemos !== -1 && usage.demos >= limits.maxDemos) {
    exceeded.push('demos');
  } else if (limits.maxDemos !== -1 && usage.demos >= limits.maxDemos * 0.8) {
    warnings.push('demos');
  }

  if (limits.maxWorkflows !== -1 && usage.workflows >= limits.maxWorkflows) {
    exceeded.push('workflows');
  } else if (limits.maxWorkflows !== -1 && usage.workflows >= limits.maxWorkflows * 0.8) {
    warnings.push('workflows');
  }

  if (limits.maxKnowledgeBases !== -1 && usage.knowledgeBases >= limits.maxKnowledgeBases) {
    exceeded.push('knowledgeBases');
  } else if (limits.maxKnowledgeBases !== -1 && usage.knowledgeBases >= limits.maxKnowledgeBases * 0.8) {
    warnings.push('knowledgeBases');
  }

  if (limits.maxDocuments !== -1 && usage.documents >= limits.maxDocuments) {
    exceeded.push('documents');
  } else if (limits.maxDocuments !== -1 && usage.documents >= limits.maxDocuments * 0.8) {
    warnings.push('documents');
  }

  if (limits.maxIntegrations !== -1 && usage.integrations >= limits.maxIntegrations) {
    exceeded.push('integrations');
  } else if (limits.maxIntegrations !== -1 && usage.integrations >= limits.maxIntegrations * 0.8) {
    warnings.push('integrations');
  }

  if (limits.maxHelpdeskAgents !== -1 && usage.helpdeskAgents >= limits.maxHelpdeskAgents) {
    exceeded.push('helpdeskAgents');
  } else if (limits.maxHelpdeskAgents !== -1 && usage.helpdeskAgents >= limits.maxHelpdeskAgents * 0.8) {
    warnings.push('helpdeskAgents');
  }

  if (limits.apiCallsPerMonth !== -1 && usage.apiCalls >= limits.apiCallsPerMonth) {
    exceeded.push('apiCalls');
  } else if (limits.apiCallsPerMonth !== -1 && usage.apiCalls >= limits.apiCallsPerMonth * 0.8) {
    warnings.push('apiCalls');
  }

  return {
    allowed: exceeded.length === 0,
    exceeded,
    warnings
  };
}

// Get upgrade prompt for exceeded limits
export function getUpgradePrompt(exceeded: string[], currentTier: SubscriptionTier): string {
  if (exceeded.length === 0) return '';
  
  const tierOrder = ['FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex >= tierOrder.length - 1) {
    return 'You have reached the maximum limits for your current plan.';
  }
  
  const nextTier = tierOrder[currentIndex + 1];
  return `You have exceeded your ${currentTier} tier limits for: ${exceeded.join(', ')}. Upgrade to ${nextTier} to increase your limits.`;
}
