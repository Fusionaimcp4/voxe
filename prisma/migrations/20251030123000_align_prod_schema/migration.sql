-- Align production schema with current app expectations
-- This migration is idempotent and safe to run on partially-updated databases.

-- 1) Ensure SubscriptionTier enum has the new values and remap legacy ones
DO $$
BEGIN
  -- Add new values if missing
  BEGIN
    ALTER TYPE "SubscriptionTier" ADD VALUE 'STARTER';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE "SubscriptionTier" ADD VALUE 'TEAM';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE "SubscriptionTier" ADD VALUE 'BUSINESS';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE "SubscriptionTier" ADD VALUE 'ENTERPRISE';
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Rename legacy values to new ones if present
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionTier' AND e.enumlabel = 'PRO'
  ) THEN
    ALTER TYPE "SubscriptionTier" RENAME VALUE 'PRO' TO 'TEAM';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionTier' AND e.enumlabel = 'PRO_PLUS'
  ) THEN
    ALTER TYPE "SubscriptionTier" RENAME VALUE 'PRO_PLUS' TO 'BUSINESS';
  END IF;
END $$;

-- 2) User table columns expected by billing and trial logic
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "freeTrialEndsAt" TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "apiCallsThisMonth" INTEGER NOT NULL DEFAULT 0;

-- Ensure subscriptionTier exists with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'subscriptionTier'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';
  END IF;
END $$;

-- Ensure subscriptionStatus exists with default (assumes enum already exists in DB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'subscriptionStatus'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';
  END IF;
END $$;

-- 3) PricingPlan columns for Stripe prices and annual discount
ALTER TABLE "PricingPlan"
  ADD COLUMN IF NOT EXISTS "stripeMonthlyPriceId" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "stripeYearlyPriceId" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "annualDiscountPercentage" INTEGER NOT NULL DEFAULT 15;

-- 4) Optional: backfill apiCallsThisMonth to 0 where NULL (safety)
UPDATE "User" SET "apiCallsThisMonth" = 0 WHERE "apiCallsThisMonth" IS NULL;


