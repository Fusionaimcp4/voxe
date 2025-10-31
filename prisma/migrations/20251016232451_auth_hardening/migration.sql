/*
  Warnings:

  - You are about to drop the column `expires` on the `verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `identifier` on the `verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `verification_tokens` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `verification_tokens` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `verification_tokens` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `tokenHash` to the `verification_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `verification_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `verification_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."verification_tokens_identifier_token_key";

-- DropIndex
DROP INDEX "public"."verification_tokens_token_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "tenantId" TEXT,
ADD COLUMN     "totpSecret" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verification_tokens" DROP COLUMN "expires",
DROP COLUMN "identifier",
DROP COLUMN "token",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "blocked_email_domains" (
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_email_domains_pkey" PRIMARY KEY ("domain")
);

-- CreateIndex
CREATE INDEX "verification_tokens_userId_type_idx" ON "verification_tokens"("userId", "type");

-- CreateIndex
CREATE INDEX "verification_tokens_expiresAt_idx" ON "verification_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
