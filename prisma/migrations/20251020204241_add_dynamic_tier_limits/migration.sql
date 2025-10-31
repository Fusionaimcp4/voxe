-- CreateTable
CREATE TABLE "tier_limits" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "maxDemos" INTEGER NOT NULL,
    "maxWorkflows" INTEGER NOT NULL,
    "maxKnowledgeBases" INTEGER NOT NULL,
    "maxDocuments" INTEGER NOT NULL,
    "maxIntegrations" INTEGER NOT NULL,
    "apiCallsPerMonth" INTEGER NOT NULL,
    "documentSizeLimit" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "maxChunksPerDocument" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tier_limits_tier_key" ON "tier_limits"("tier");
