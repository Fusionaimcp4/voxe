/**
 * Create Stripe Checkout Session API
 * Handles both subscription purchases and credit top-ups
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, isStripeBillingEnabled } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/stripe-db';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check if billing is enabled
    if (!isStripeBillingEnabled() || !stripe) {
      return NextResponse.json(
        { error: 'Billing is not enabled' },
        { status: 503 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { type, planId, amountUsd, billingCycle } = body; // Add billingCycle

    // Validate request
    if (!type || !['subscription', 'topup'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "subscription" or "topup"' },
        { status: 400 }
      );
    }

    if (type === 'subscription' && (!planId || !billingCycle)) { // billingCycle is now required
      return NextResponse.json(
        { error: 'planId and billingCycle are required for subscription' },
        { status: 400 }
      );
    }

    if (type === 'topup' && !amountUsd) {
      return NextResponse.json(
        { error: 'amountUsd is required for top-up' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma!.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, stripeCustomerId: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = await getOrCreateStripeCustomer(
      session.user.id,
      user.email,
      user.name || undefined
    );

    // Set success and cancel URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/billing/cancel`;

    let checkoutSession;

    if (type === 'subscription') {
      // Fetch pricing plan from database
      const pricingPlan = await prisma!.pricingPlan.findUnique({
        where: { id: planId },
        select: { // Select the new fields
          id: true,
          tier: true,
          name: true,
          description: true,
          currency: true,
          price: true, // Keep price for calculating annual equivalent if needed, though we will use stripe price IDs directly
          period: true,
          stripeMonthlyPriceId: true,
          stripeYearlyPriceId: true,
        }
      });

      if (!pricingPlan) {
        return NextResponse.json(
          { error: 'Pricing plan not found' },
          { status: 404 }
        );
      }

      let stripePriceIdToUse: string | undefined;

      if (billingCycle === 'yearly') {
        stripePriceIdToUse = pricingPlan.stripeYearlyPriceId ?? undefined;
      } else {
        stripePriceIdToUse = pricingPlan.stripeMonthlyPriceId ?? undefined;
      }

      if (!stripePriceIdToUse) {
        return NextResponse.json(
          { error: `Stripe Price ID not configured for ${billingCycle} billing for this plan` },
          { status: 400 }
        );
      }

      // Create subscription checkout session (with retry if customer ID is invalid)
      const createSubscriptionSession = async (custId: string) => stripe!.checkout.sessions.create({
        customer: custId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceIdToUse, // Use the correct Stripe Price ID
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: session.user.id,
          planId: pricingPlan.id,
          tier: pricingPlan.tier,
          type: 'subscription',
          billingCycle: billingCycle === 'yearly' ? 'year' : 'month', // Convert to month/year format
        },
        subscription_data: {
          metadata: {
            userId: session.user.id,
            planId: pricingPlan.id,
            tier: pricingPlan.tier,
            billingCycle: billingCycle === 'yearly' ? 'year' : 'month', // Convert to month/year format
          },
        },
      });

      try {
        checkoutSession = await createSubscriptionSession(customerId);
      } catch (e: any) {
        // If the stored customer ID is from the wrong Stripe environment, recreate and retry once
        if (e?.raw?.code === 'resource_missing' && typeof e?.raw?.message === 'string' && e.raw.message.includes('No such customer')) {
          await prisma!.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: null } });
          const newCustomer = await stripe!.customers.create({ email: user.email!, name: user.name || undefined });
          await prisma!.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: newCustomer.id } });
          customerId = newCustomer.id;
          checkoutSession = await createSubscriptionSession(customerId);
        } else {
          throw e;
        }
      }
    } else {
      // Create one-time payment for credit top-up (with retry if customer ID invalid)
      const createTopupSession = async (custId: string) => stripe!.checkout.sessions.create({
        customer: custId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'LocalBoxs Credits',
                description: `Top-up balance: $${amountUsd.toFixed(2)}`,
              },
              unit_amount: Math.round(amountUsd * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: session.user.id,
          type: 'topup',
          amountUsd: amountUsd.toString(),
        },
      });

      try {
        checkoutSession = await createTopupSession(customerId);
      } catch (e: any) {
        if (e?.raw?.code === 'resource_missing' && typeof e?.raw?.message === 'string' && e.raw.message.includes('No such customer')) {
          await prisma!.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: null } });
          const newCustomer = await stripe!.customers.create({ email: user.email!, name: user.name || undefined });
          await prisma!.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: newCustomer.id } });
          customerId = newCustomer.id;
          checkoutSession = await createTopupSession(customerId);
        } else {
          throw e;
        }
      }
    }

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Failed to create checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
