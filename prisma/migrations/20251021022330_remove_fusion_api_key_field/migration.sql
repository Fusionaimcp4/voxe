/*
  Warnings:

  - You are about to drop the column `fusionApiKey` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `fusionSubAccountId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "fusionApiKey",
DROP COLUMN "fusionSubAccountId";
