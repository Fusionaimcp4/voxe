/**
 * Stripe client initialization and configuration
 * Handles test/production key switching
 */

import Stripe from 'stripe';
import { env } from './env';

// Get Stripe secret key based on environment
export function getStripeSecretKey(): string | null {
  const billingEnabled = env.STRIPE_BILLING_ENABLED === 'true';
  
  if (!billingEnabled) {
    console.warn('Stripe billing is not enabled. Set STRIPE_BILLING_ENABLED=true to enable.');
    return null;
  }

  // Prefer unified LIVE key if present; fall back to TEST key.
  // This allows using live credentials in any environment without code changes.
  const key = env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY_TEST;

  if (!key) {
    throw new Error('Stripe secret key not found. Set STRIPE_SECRET_KEY (or STRIPE_SECRET_KEY_TEST).');
  }

  return key;
}

// Initialize Stripe client
export const stripe = ((): Stripe | null => {
  const secretKey = getStripeSecretKey();
  
  if (!secretKey) {
    return null;
  }

  // Use Stripe's default API version configured on the account to avoid type mismatches.
  return new Stripe(secretKey, {
    typescript: true,
  });
})();

// Get webhook secret based on environment
export function getStripeWebhookSecret(): string | null {
  const billingEnabled = env.STRIPE_BILLING_ENABLED === 'true';
  
  if (!billingEnabled) {
    return null;
  }

  // Prefer unified LIVE secret; fall back to TEST secret.
  const secret = env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET_TEST;

  if (!secret) {
    console.warn(
      `Stripe webhook secret not found for ${process.env.NODE_ENV} environment. ` +
      `Webhook verification will fail. Set STRIPE_WEBHOOK_SECRET${process.env.NODE_ENV === 'production' ? '' : '_TEST'}`
    );
  }

  return secret || null;
}

// Check if Stripe billing is enabled
export function isStripeBillingEnabled(): boolean {
  return env.STRIPE_BILLING_ENABLED === 'true';
}

// Get publishable key for client-side
export function getStripePublishableKey(): string | null {
  // Prefer unified LIVE publishable key; fall back to TEST publishable key.
  const key = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
  
  return key || null;
}
