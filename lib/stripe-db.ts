/**
 * Database helpers for Stripe billing operations
 * Handles Stripe customer management, transactions, and user balance updates
 */

import { prisma } from './prisma';
import { stripe } from './stripe';
import { SubscriptionTier } from './generated/prisma';
import { sendEmail, loadEmailTemplate } from './mailer';

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Return existing customer ID if exists
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  if (!stripe) {
    throw new Error('Stripe is not initialized. Check your environment variables.');
  }

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id }
  });

  return customer.id;
}

/**
 * Update user subscription information
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionId: string,
  tier: SubscriptionTier,
  status: 'ACTIVE' | 'CANCELLED' = 'ACTIVE',
  billingCycle: 'month' | 'year' = 'month', // New: Add billingCycle parameter
): Promise<void> {
  let subscriptionExpiresAt: Date | null = null;
  if (status === 'ACTIVE') {
    const now = new Date();
    if (billingCycle === 'year') {
      subscriptionExpiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else { // Default to month
      subscriptionExpiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionExpiresAt: subscriptionExpiresAt,
      apiCallsThisMonth: status === 'ACTIVE' ? 0 : undefined, // Reset API calls counter when activating new subscription
      freeTrialEndsAt: status === 'ACTIVE' ? null : undefined, // Clear free trial when upgrading to paid plan
    }
  });
}

/**
 * Add balance to user account (from top-up)
 */
export async function addBalanceToUser(userId: string, amountUsd: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      balanceUsd: {
        increment: amountUsd,
      }
    }
  });
}

/**
 * Deduct balance from user account (for over-quota API calls)
 */
export async function deductBalanceFromUser(userId: string, amountUsd: number): Promise<boolean> {
  // Use a transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balanceUsd: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentBalance = Number(user.balanceUsd);

    if (currentBalance < amountUsd) {
      return false; // Insufficient balance
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        balanceUsd: {
          decrement: amountUsd,
        }
      }
    });

    return true; // Deduction successful
  });

  return result;
}

/**
 * Reset monthly API call counter (called on invoice.payment_succeeded)
 */
export async function resetMonthlyApiCalls(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      apiCallsThisMonth: 0,
    }
  });
}

/**
 * Get user's current balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceUsd: true }
  });

  return user ? Number(user.balanceUsd) : 0;
}

/**
 * Get user's API call count for current month
 */
export async function getUserApiCallsThisMonth(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiCallsThisMonth: true }
  });

  return user?.apiCallsThisMonth || 0;
}

/**
 * Increment API call counter
 */
export async function incrementApiCallsThisMonth(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      apiCallsThisMonth: {
        increment: 1,
      }
    }
  });
}

/**
 * Create a transaction record
 */
export async function createTransaction(data: {
  userId: string;
  type: 'SUBSCRIPTION_PAYMENT' | 'SUBSCRIPTION_UPGRADE' | 'SUBSCRIPTION_DOWNGRADE' | 'SUBSCRIPTION_CANCEL' | 'CREDIT_TOPUP' | 'REFUND';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  productType: 'subscription' | 'credit_topup';
  subscriptionTier?: SubscriptionTier;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  stripeInvoiceId?: string;
  description?: string;
  metadata?: any;
}): Promise<void> {
  await prisma.transaction.create({
    data: {
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      productType: data.productType,
      subscriptionTier: data.subscriptionTier,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId,
      stripeInvoiceId: data.stripeInvoiceId,
      description: data.description,
      metadata: data.metadata,
    }
  });
}

/**
 * Get transactions for a user
 */
export async function getUserTransactions(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return transactions;
}

/**
 * Downgrade user to FREE tier (on subscription cancellation)
 */
export async function downgradeUserToFree(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'ACTIVE',
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
    }
  });
}

/**
 * Sends email notification when free trial expires
 */
async function sendTrialExpiredEmail(userEmail: string, userName: string | null): Promise<void> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const appName = process.env.APP_NAME || 'Voxe';
    const supportEmail = process.env.SUPPORT_EMAIL || `support@${process.env.EMAIL_DOMAIN || 'mcp4.ai'}`;
    const supportUrl = `${baseUrl}/contact`;
    const upgradeUrl = `${baseUrl}/pricing`;

    const emailHtml = await loadEmailTemplate('trial-expired', {
      userName: userName || 'there',
      appName,
      upgradeUrl,
      supportUrl,
      supportEmail,
      currentYear: new Date().getFullYear().toString(),
    });

    await sendEmail({
      to: userEmail,
      subject: `Your ${appName} Free Trial Has Ended`,
      html: emailHtml,
    });
  } catch (error) {
    console.error(`Failed to send trial expired email to ${userEmail}:`, error);
    // Don't throw - email failure shouldn't block trial expiration
  }
}

/**
 * Sends email notification when free trial is expiring soon (3 days before)
 */
export async function handleExpiringFreeTrials(): Promise<void> {
  console.log('Checking for expiring free trials...');
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find users whose trial expires in 3 days (and haven't been notified yet)
  const expiringTrialUsers = await prisma.user.findMany({
    where: {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'ACTIVE',
      freeTrialEndsAt: {
        gte: tomorrow, // Trial ends at least 1 day from now
        lte: threeDaysFromNow, // Trial ends within 3 days
      },
      // Add a flag to track if we've sent the reminder (optional - can be added to User model if needed)
    },
    select: {
      id: true,
      email: true,
      name: true,
      freeTrialEndsAt: true,
    },
  });

  if (expiringTrialUsers.length === 0) {
    console.log('No expiring free trials found.');
    return;
  }

  console.log(`Found ${expiringTrialUsers.length} users with expiring free trials. Sending reminders...`);

  for (const user of expiringTrialUsers) {
    try {
      if (!user.freeTrialEndsAt) continue;

      const trialEndDate = new Date(user.freeTrialEndsAt);
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const appName = process.env.APP_NAME || 'Voxe';
      const supportEmail = process.env.SUPPORT_EMAIL || `support@${process.env.EMAIL_DOMAIN || 'mcp4.ai'}`;
      const upgradeUrl = `${baseUrl}/pricing`;

      const emailHtml = await loadEmailTemplate('trial-expiring-soon', {
        userName: user.name || 'there',
        appName,
        daysRemaining: daysRemaining.toString(),
        daysRemainingPlural: daysRemaining !== 1 ? 's' : '',
        trialEndDate: trialEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        upgradeUrl,
        supportEmail,
        currentYear: new Date().getFullYear().toString(),
      });

      await sendEmail({
        to: user.email,
        subject: `Your ${appName} Free Trial Ends in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
        html: emailHtml,
      });

      console.log(`Sent trial expiration reminder to ${user.email} (${daysRemaining} days remaining)`);
    } catch (error) {
      console.error(`Failed to send trial expiration reminder to ${user.email} (ID: ${user.id}):`, error);
    }
  }

  console.log('Finished processing expiring free trials.');
}

/**
 * Handles automatic downgrade/plan adjustment for users whose free trial has expired.
 * This function should be called periodically by a cron job or similar scheduled task.
 */
export async function handleExpiredFreeTrialUsers(): Promise<void> {
  console.log('Checking for expired free trials...');
  const now = new Date();

  const expiredTrialUsers = await prisma.user.findMany({
    where: {
      subscriptionTier: 'FREE',
      freeTrialEndsAt: {
        lte: now, // freeTrialEndsAt is less than or equal to now
      },
      subscriptionStatus: 'ACTIVE', // Only target active free trial users
    },
    select: {
      id: true,
      email: true,
      name: true,
      freeTrialEndsAt: true,
    },
  });

  if (expiredTrialUsers.length === 0) {
    console.log('No expired free trials found.');
    return;
  }

  console.log(`Found ${expiredTrialUsers.length} users with expired free trials. Processing...`);

  for (const user of expiredTrialUsers) {
    try {
      // Update user status to EXPIRED
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'EXPIRED',
          subscriptionExpiresAt: user.freeTrialEndsAt, // Record when the trial actually ended
          freeTrialEndsAt: null, // Clear the trial end date as it's now expired
        },
      });

      // Create transaction record
      await createTransaction({
        userId: user.id,
        type: 'SUBSCRIPTION_DOWNGRADE',
        amount: 0, // No monetary value change
        currency: 'USD',
        status: 'COMPLETED',
        productType: 'subscription',
        subscriptionTier: 'FREE',
        description: 'Free trial expired, subscription status set to EXPIRED.',
        metadata: {
          previousStatus: 'ACTIVE',
          newStatus: 'EXPIRED',
          trialEndedAt: user.freeTrialEndsAt?.toISOString(),
        },
      });

      // Send expiration email notification
      await sendTrialExpiredEmail(user.email, user.name);

      console.log(`User ${user.email} (ID: ${user.id}) free trial expired. Status updated to EXPIRED and email sent.`);
    } catch (error) {
      console.error(`Failed to process expired free trial for user ${user.email} (ID: ${user.id}):`, error);
    }
  }
  console.log('Finished processing expired free trials.');
}
