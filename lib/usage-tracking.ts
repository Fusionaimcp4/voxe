import { prisma } from '@/lib/prisma';
import { SubscriptionTier } from '@/lib/generated/prisma';
import { getDynamicTierLimits, DynamicTierLimits } from '@/lib/dynamic-tier-limits';
import { checkUsageLimits } from '@/lib/tier-access';
import { FusionSubAccountService } from '@/lib/fusion-sub-accounts';
import { getTierLimits } from '@/lib/features';

export interface UsageStats {
  demos: number;
  workflows: number;
  knowledgeBases: number;
  documents: number;
  integrations: number;
  helpdeskAgents: number;
  apiCalls: number;
  fusionSpend: number;
  fusionRequests: number;
}

// Metering helper: decide if a call is covered by plan or billed from balance.
// If no cost provided, fetches actual Fusion costs first.
export async function consumeApiCall(
  userId: string,
  usageCostUsd?: number
): Promise<{
  allowed: boolean;
  coveredByPlan: boolean;
  overQuota: boolean;
  balanceAfter?: number;
  reason?: string;
}> {
  try {
    const user = await prisma!.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        apiCallsThisMonth: true,
        balanceUsd: true,
        freeTrialEndsAt: true, // Include freeTrialEndsAt
      }
    });

    if (!user) {
      return { allowed: false, coveredByPlan: false, overQuota: false, reason: 'User not found' };
    }

    const tier = user.subscriptionTier as SubscriptionTier;
    const limits = await getDynamicTierLimits(tier);
    const quota = limits.apiCallsPerMonth; // -1 means unlimited

    // Check for expired free trial for FREE tier users
    if (tier === 'FREE' && user.freeTrialEndsAt && new Date() > new Date(user.freeTrialEndsAt)) {
      return {
        allowed: false,
        coveredByPlan: false,
        overQuota: false,
        reason: 'Free trial has ended. Please upgrade your plan.'
      };
    }

    // Covered by plan if under quota or unlimited
    const underQuota = quota === -1 || user.apiCallsThisMonth < quota;
    if (underQuota) {
      await prisma!.user.update({
        where: { id: userId },
        data: { apiCallsThisMonth: { increment: 1 } }
      });
      return { allowed: true, coveredByPlan: true, overQuota: false, balanceAfter: Number(user.balanceUsd) };
    }

    // Over quota: need to deduct exact cost from balance
    const currentBalance = Number(user.balanceUsd || 0);
    if (usageCostUsd === undefined) {
      return {
        allowed: false,
        coveredByPlan: false,
        overQuota: true,
        balanceAfter: currentBalance,
        reason: 'Usage cost not provided for over-quota call.'
      };
    }

    if (currentBalance >= usageCostUsd) {
      const updated = await prisma!.user.update({
        where: { id: userId },
        data: {
          apiCallsThisMonth: { increment: 1 },
          balanceUsd: { decrement: usageCostUsd }
        },
        select: { balanceUsd: true }
      });
      return { allowed: true, coveredByPlan: false, overQuota: true, balanceAfter: Number(updated.balanceUsd) };
    }

    // Insufficient balance
    return {
      allowed: false,
      coveredByPlan: false,
      overQuota: true,
      balanceAfter: currentBalance,
      reason: 'Insufficient balance. Please add funds.'
    };
  } catch (error) {
    console.error('Failed to consume API call:', error);
    return { allowed: false, coveredByPlan: false, overQuota: false, reason: 'Internal error' };
  }
}

// Usage tracking for API routes
export async function trackUsage(
  userId: string, 
  action: 'demo_created' | 'workflow_created' | 'knowledge_base_created' | 'document_uploaded' | 'integration_created' | 'api_call'
): Promise<void> {
  try {
    // For now, we'll track usage in a simple way
    // In a production system, you might want to use Redis or a dedicated analytics service
    console.log(`[Usage] User ${userId} performed ${action}`);
    
    // You could implement more sophisticated tracking here:
    // - Store in a usage_logs table
    // - Update Redis counters
    // - Send to analytics service
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

// Get current usage stats for a user
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  try {
    const [demos, workflows, knowledgeBases, documents, integrations, helpdeskAgents, user] = await Promise.all([
      prisma!.demo.count({ where: { userId } }),
      prisma!.workflow.count({ where: { userId } }),
      prisma!.knowledgeBase.count({ where: { userId } }),
      prisma!.document.count({ 
        where: { 
          knowledgeBase: { userId } 
        } 
      }),
      prisma!.integration.count({ where: { userId } }),
      prisma!.helpdeskUser.count({ where: { userId } }),
      prisma!.user.findUnique({
        where: { id: userId },
        select: { fusionSubAccountId: true }
      })
    ]);

    // Get API calls from both Fusion and our local tracking
    let fusionApiCalls = 0;
    let localApiCalls = 0;
    let fusionSpend = 0; // Initialize fusionSpend
    let fusionRequests = 0; // Initialize fusionRequests
    
    // Get Fusion API calls if user has a sub-account
    if (user?.fusionSubAccountId) {
      try {
        const usageData = await FusionSubAccountService.getUsageMetrics(parseInt(user.fusionSubAccountId));
        fusionApiCalls = usageData.metrics?.requests || 0;
        fusionSpend = usageData.metrics?.spend || 0; // Populate fusionSpend
        fusionRequests = usageData.metrics?.requests || 0; // Populate fusionRequests
      } catch (error) {
        console.error('Failed to get Fusion usage data:', error);
        // Continue with fusionApiCalls = 0 if Fusion call fails
      }
    }
    
    // Get local API calls (knowledge base processing, etc.)
    try {
      const localStats = await prisma!.apiCallLog.aggregate({
        where: { userId },
        _count: { id: true },
      });
      localApiCalls = localStats._count.id;
    } catch (error) {
      console.error('Failed to get local API call stats:', error);
    }
    
    // Total API calls = Fusion calls + Local calls
    const apiCalls = fusionApiCalls + localApiCalls;

    return {
      demos,
      workflows,
      knowledgeBases,
      documents,
      integrations,
      helpdeskAgents,
      apiCalls,
      fusionSpend,
      fusionRequests,
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return {
      demos: 0,
      workflows: 0,
      knowledgeBases: 0,
      documents: 0,
      integrations: 0,
      helpdeskAgents: 0,
      apiCalls: 0,
      fusionSpend: 0,
      fusionRequests: 0,
    };
  }
}

// Check if user can perform an action based on their tier
export async function canPerformAction(
  userId: string, 
  action: 'create_demo' | 'create_workflow' | 'create_knowledge_base' | 'upload_document' | 'create_integration'
): Promise<{ allowed: boolean; reason?: string; usage?: UsageStats }> {
  try {
    const user = await prisma!.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        freeTrialEndsAt: true, // Include freeTrialEndsAt
      }
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    const userTier = user.subscriptionTier as SubscriptionTier;
    const limits = await getDynamicTierLimits(userTier);

    // Check for expired free trial for FREE tier users
    if (userTier === 'FREE' && user.freeTrialEndsAt && new Date() > new Date(user.freeTrialEndsAt)) {
      return {
        allowed: false,
        reason: 'Free trial has ended. Please upgrade your plan.',
        usage: await getUserUsageStats(userId) // Provide updated usage stats
      };
    }

    const usage = await getUserUsageStats(userId);
    const usageCheck = checkUsageLimits(userTier, usage);

    // Check specific action limits using dynamic limits
    switch (action) {
      case 'create_demo':
        if (limits.maxDemos !== -1 && usage.demos >= limits.maxDemos) {
          return { 
            allowed: false, 
            reason: `Demo limit reached (${limits.maxDemos}). Upgrade to increase limits.`,
            usage 
          };
        }
        break;
      
      case 'create_workflow':
        if (limits.maxWorkflows !== -1 && usage.workflows >= limits.maxWorkflows) {
          return { 
            allowed: false, 
            reason: `Workflow limit reached (${limits.maxWorkflows}). Upgrade to increase limits.`,
            usage 
          };
        }
        break;
      
      case 'create_knowledge_base':
        if (limits.maxKnowledgeBases !== -1 && usage.knowledgeBases >= limits.maxKnowledgeBases) {
          return { 
            allowed: false, 
            reason: `Knowledge base limit reached (${limits.maxKnowledgeBases}). Upgrade to increase limits.`,
            usage 
          };
        }
        break;
      
      case 'upload_document':
        if (limits.maxDocuments !== -1 && usage.documents >= limits.maxDocuments) {
          return { 
            allowed: false, 
            reason: `Document limit reached (${limits.maxDocuments}). Upgrade to increase limits.`,
            usage 
          };
        }
        break;
      
      case 'create_integration':
        if (limits.maxIntegrations !== -1 && usage.integrations >= limits.maxIntegrations) {
          return { 
            allowed: false, 
            reason: `Integration limit reached (${limits.maxIntegrations}). Upgrade to increase limits.`,
            usage 
          };
        }
        break;
    }

    return { allowed: true, usage };
  } catch (error) {
    console.error('Failed to check action permission:', error);
    return { allowed: false, reason: 'Internal error' };
  }
}

// Middleware helper for API routes
export function withTierCheck(
  handler: (req: Request, context: any) => Promise<Response>,
  requiredTier: SubscriptionTier = 'FREE'
) {
  return async (req: Request, context: any) => {
    try {
      // Get user from session (you'll need to implement this based on your auth setup)
      const userId = context.userId; // This should be set by your auth middleware
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const user = await prisma!.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
      });

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const userTier = user.subscriptionTier as SubscriptionTier;
      const limits = getTierLimits(userTier);
      
      // Check if user has access to the required tier
      const tierOrder = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
      const userTierIndex = tierOrder.indexOf(userTier);
      const requiredTierIndex = tierOrder.indexOf(requiredTier);
      
      if (userTierIndex < requiredTierIndex) {
        return new Response(
          JSON.stringify({ 
            error: 'Tier Upgrade Required',
            requiredTier,
            currentTier: userTier,
            message: `This feature requires ${requiredTier} tier or higher.`
          }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Call the original handler
      return await handler(req, context);
    } catch (error) {
      console.error('Tier check middleware error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// Usage analytics helper
export async function getUsageAnalytics(userId: string) {
  try {
    const usage = await getUserUsageStats(userId);
    const user = await prisma!.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) {
      return null;
    }

    const limits = getTierLimits(user.subscriptionTier as SubscriptionTier);
    const usageCheck = checkUsageLimits(user.subscriptionTier as SubscriptionTier, usage);

    return {
      usage,
      limits,
      status: usageCheck,
      tier: user.subscriptionTier
    };
  } catch (error) {
    console.error('Failed to get usage analytics:', error);
    return null;
  }
}
