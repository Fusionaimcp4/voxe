-- Add Stripe billing fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "apiCallsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "balanceUsd" DECIMAL(12,4) NOT NULL DEFAULT 0;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeCustomerId_key" ON "users"("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeSubscriptionId_key" ON "users"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL;

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeInvoiceId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "subscriptionTier" "SubscriptionTier",
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_stripePaymentIntentId_key" ON "transactions"("stripePaymentIntentId") WHERE "stripePaymentIntentId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_stripeCheckoutSessionId_key" ON "transactions"("stripeCheckoutSessionId") WHERE "stripeCheckoutSessionId" IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX IF NOT EXISTS "transactions_stripePaymentIntentId_idx" ON "transactions"("stripePaymentIntentId");
CREATE INDEX IF NOT EXISTS "transactions_stripeCheckoutSessionId_idx" ON "transactions"("stripeCheckoutSessionId");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");
CREATE INDEX IF NOT EXISTS "transactions_createdAt_idx" ON "transactions"("createdAt");

-- Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_userId_fkey'
    ) THEN
        ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
