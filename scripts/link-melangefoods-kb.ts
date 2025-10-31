/**
 * Link Melangefoods Knowledge Base to Workflow
 */

import { prisma } from '../lib/prisma';

async function linkKB() {
  console.log('🔗 Linking Melangefoods KB to workflow...\n');

  const workflowId = 'cmgo8jef70003ifrk7qf5mwpn'; // melangefoods.com
  const kbId = 'cmgoa8frg0001if5sjjn7cblu'; // Melangefoods KB

  // Check if already linked
  const existing = await prisma.workflowKnowledgeBase.findFirst({
    where: {
      workflowId,
      knowledgeBaseId: kbId,
    },
  });

  if (existing) {
    console.log('✅ Already linked!');
    console.log(`   Workflow: ${workflowId}`);
    console.log(`   KB: ${kbId}`);
    await prisma.$disconnect();
    return;
  }

  // Create the link
  await prisma.workflowKnowledgeBase.create({
    data: {
      workflowId,
      knowledgeBaseId: kbId,
      priority: 1,
      retrievalLimit: 5,
      similarityThreshold: 0.7,
      isActive: true,
    },
  });

  console.log('✅ Successfully linked!');
  console.log(`   Workflow: melangefoods.com (${workflowId})`);
  console.log(`   KB: Melangefoods (${kbId})`);
  console.log(`   Priority: 1`);
  console.log(`   Retrieval Limit: 5`);
  console.log(`   Similarity Threshold: 0.7`);

  await prisma.$disconnect();
}

linkKB().catch(console.error);

