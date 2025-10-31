// Billing metering integration test in pure ESM JavaScript (no ts-node)
// - Seeds a test user
// - Tests covered, deducted, and blocked scenarios

import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

async function getQuotaForTier(tier) {
  // TierLimit.apiCallsPerMonth is the monthly included quota
  const tl = await prisma.tierLimit.findUnique({ where: { tier } });
  if (!tl) throw new Error(`TierLimit not found for tier ${tier}`);
  return tl.apiCallsPerMonth; // -1 means unlimited
}

async function consumeApiCallRaw(userId, usageCostUsd) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      apiCallsThisMonth: true,
      balanceUsd: true,
    },
  });
  if (!user) return { allowed: false, reason: 'User not found' };

  const quota = await getQuotaForTier(user.subscriptionTier);
  const underQuota = quota === -1 || user.apiCallsThisMonth < quota;
  if (underQuota) {
    await prisma.user.update({
      where: { id: userId },
      data: { apiCallsThisMonth: { increment: 1 } },
    });
    return { allowed: true, coveredByPlan: true, overQuota: false, balanceAfter: Number(user.balanceUsd || 0) };
  }

  const currentBalance = Number(user.balanceUsd || 0);
  if (currentBalance >= usageCostUsd) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        apiCallsThisMonth: { increment: 1 },
        balanceUsd: { decrement: usageCostUsd },
      },
      select: { balanceUsd: true },
    });
    return { allowed: true, coveredByPlan: false, overQuota: true, balanceAfter: Number(updated.balanceUsd) };
  }

  return { allowed: false, coveredByPlan: false, overQuota: true, balanceAfter: currentBalance, reason: 'Insufficient balance' };
}

async function main() {
  const email = 'test-billing-js@example.com';
  const tier = 'PRO';

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      subscriptionTier: tier,
      subscriptionStatus: 'ACTIVE',
      apiCallsThisMonth: 0,
      balanceUsd: 0,
    },
    create: {
      email,
      name: 'Billing JS Test User',
      role: 'USER',
      subscriptionTier: tier,
      subscriptionStatus: 'ACTIVE',
    },
    select: { id: true },
  });
  const userId = user.id;

  const quota = await getQuotaForTier(tier);
  if (!(typeof quota === 'number' && quota !== 0)) {
    throw new Error('Quota must be configured and > 0 for PRO');
  }

  // 1) Covered by plan
  await prisma.user.update({ where: { id: userId }, data: { apiCallsThisMonth: quota - 1, balanceUsd: 0 } });
  const covered = await consumeApiCallRaw(userId, 0.000403);
  console.log(JSON.stringify({ case: 'CoveredByPlan', covered }, null, 2));

  // 2) Deduct from balance
  await prisma.user.update({ where: { id: userId }, data: { apiCallsThisMonth: quota, balanceUsd: 0.01 } });
  const deducted = await consumeApiCallRaw(userId, 0.005);
  console.log(JSON.stringify({ case: 'DeductedFromBalance', deducted }, null, 2));

  // 3) Block insufficient balance
  await prisma.user.update({ where: { id: userId }, data: { apiCallsThisMonth: quota, balanceUsd: 0 } });
  const blocked = await consumeApiCallRaw(userId, 0.005);
  console.log(JSON.stringify({ case: 'BlockedInsufficient', blocked }, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { try { await prisma.$disconnect(); } catch {} });


