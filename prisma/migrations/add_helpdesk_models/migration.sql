-- AlterTable
ALTER TABLE "tier_limits" ADD COLUMN IF NOT EXISTS "maxHelpdeskAgents" INTEGER DEFAULT 1;

-- CreateTable
CREATE TABLE IF NOT EXISTS "helpdesk_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "chatwootUserId" INTEGER,
    "chatwootRole" TEXT NOT NULL DEFAULT 'agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "helpdesk_user_inboxes" (
    "id" TEXT NOT NULL,
    "helpdeskUserId" TEXT NOT NULL,
    "inboxId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "helpdesk_user_inboxes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "helpdesk_user_inboxes_helpdeskUserId_inboxId_key" UNIQUE ("helpdeskUserId", "inboxId")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "helpdesk_users_userId_idx" ON "helpdesk_users"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "helpdesk_user_inboxes_helpdeskUserId_idx" ON "helpdesk_user_inboxes"("helpdeskUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "helpdesk_user_inboxes_inboxId_idx" ON "helpdesk_user_inboxes"("inboxId");

-- AddForeignKey
ALTER TABLE "helpdesk_users" ADD CONSTRAINT "helpdesk_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_user_inboxes" ADD CONSTRAINT "helpdesk_user_inboxes_helpdeskUserId_fkey" FOREIGN KEY ("helpdeskUserId") REFERENCES "helpdesk_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

