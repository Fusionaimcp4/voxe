/**
 * Stripe Webhook Handler
 * Processes Stripe events with signature verification
 * IMPORTANT: In production, ensure Nginx forwards raw request body for signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, getStripeWebhookSecret } from '@/lib/stripe';
import {
  updateUserSubscription,
  addBalanceToUser,
  resetMonthlyApiCalls,
  downgradeUserToFree,
  createTransaction,
} from '@/lib/stripe-db';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Disable Next.js body parsing for webhooks - we need raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !getStripeWebhookSecret()) {
      return NextResponse.json(
        { error: 'Stripe webhook not configured' },
        { status: 503 }
      );
    }

    // Get raw body text for signature verification
    // CRITICAL: Must get raw text, not parsed JSON
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        getStripeWebhookSecret()!
      );
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('[Webhook] Received event:', event.type, event.id);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case 'invoice.payment_succeeded': {
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      }

      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Process both subscription purchases and credit top-ups
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('[Webhook] Missing userId in session metadata');
    return;
  }

  const sessionType = session.metadata?.type;
  const billingCycle = session.metadata?.billingCycle as 'month' | 'year' | undefined; // Get billing cycle

  if (sessionType === 'subscription') {
    // Subscription purchase completed
    const planId = session.metadata?.planId;
    const tier = session.metadata?.tier as any;

    if (!planId || !tier || !billingCycle) { // billingCycle is now required
      console.error('[Webhook] Missing planId, tier, or billingCycle for subscription');
      return;
    }

    // Update user subscription
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription?.id;

    if (subscriptionId) {
      await updateUserSubscription(userId, subscriptionId, tier, 'ACTIVE', billingCycle);

      // Create transaction record
      await createTransaction({
        userId,
        type: 'SUBSCRIPTION_PAYMENT',
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        status: 'COMPLETED',
        productType: 'subscription',
        subscriptionTier: tier,
        stripeCheckoutSessionId: session.id,
        description: `Subscription: ${tier}`,
      });

      console.log(`[Webhook] Subscription activated for user ${userId}`);
    }
  } else if (sessionType === 'topup') {
    // Credit top-up completed
    const amountUsd = parseFloat(session.metadata?.amountUsd || '0');

    if (amountUsd <= 0) {
      console.error('[Webhook] Invalid top-up amount');
      return;
    }

    // Add balance to user account
    await addBalanceToUser(userId, amountUsd);

    // Create transaction record
    await createTransaction({
      userId,
      type: 'CREDIT_TOPUP',
      amount: amountUsd,
      currency: session.currency || 'usd',
      status: 'COMPLETED',
      productType: 'credit_topup',
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : undefined,
      description: `Credit top-up: $${amountUsd.toFixed(2)}`,
    });

    console.log(`[Webhook] Added $${amountUsd} balance for user ${userId}`);
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Reset monthly API call counter on subscription renewal
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) {
    console.error('[Webhook] Missing customer ID in invoice');
    return;
  }

  // Find user by Stripe customer ID
  const user = await prisma!.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`[Webhook] User not found for customer ${customerId}`);
    return;
  }

  // Reset monthly API call counter
  await resetMonthlyApiCalls(user.id);

  // Create transaction record
  if (invoice.subscription) {
    await createTransaction({
      userId: user.id,
      type: 'SUBSCRIPTION_PAYMENT',
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency || 'usd',
      status: 'COMPLETED',
      productType: 'subscription',
      subscriptionTier: user.subscriptionTier as any,
      stripeInvoiceId: invoice.id,
      description: 'Subscription renewal',
    });
  }

  console.log(`[Webhook] Reset monthly counters for user ${user.id}`);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await prisma!.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Create failed transaction record
  await createTransaction({
    userId: user.id,
    type: 'SUBSCRIPTION_PAYMENT',
    amount: (invoice.amount_due || 0) / 100,
    currency: invoice.currency || 'usd',
    status: 'FAILED',
    productType: 'subscription',
    stripeInvoiceId: invoice.id,
    description: 'Payment failed',
  });

  console.log(`[Webhook] Payment failed for user ${user.id}`);
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('[Webhook] Missing userId in subscription metadata');
    return;
  }

  const tier = subscription.metadata?.tier as any;
  const billingCycle = subscription.metadata?.billingCycle as 'month' | 'year' | undefined; // Get billing cycle

  if (!tier || !billingCycle) { // billingCycle is now required
    console.error('[Webhook] Missing tier or billingCycle in subscription metadata');
    return;
  }

  await updateUserSubscription(
    userId,
    subscription.id,
    tier,
    subscription.status === 'active' || subscription.status === 'trialing' ? 'ACTIVE' : 'CANCELLED',
    billingCycle // Pass billingCycle
  );

  console.log(`[Webhook] Updated subscription for user ${userId}`);
}

/**
 * Handle subscription deleted
 * Downgrade user to FREE tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('[Webhook] Missing userId in subscription metadata');
    return;
  }

  await downgradeUserToFree(userId);

  await createTransaction({
    userId,
    type: 'SUBSCRIPTION_CANCEL',
    amount: 0,
    currency: 'usd',
    status: 'COMPLETED',
    productType: 'subscription',
    description: 'Subscription cancelled',
  });

  console.log(`[Webhook] Downgraded user ${userId} to FREE tier`);
}
