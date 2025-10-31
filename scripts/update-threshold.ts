import { prisma } from '../lib/prisma';

async function updateThreshold() {
  console.log('🔧 Updating similarity threshold to 0.4...\n');

  const link = await prisma.workflowKnowledgeBase.findFirst({
    where: {
      workflow: {
        n8nWorkflowId: 'zCpmybq6jjvLYenU',
      },
      knowledgeBase: {
        name: {
          contains: 'Melange',
          mode: 'insensitive',
        },
      },
    },
  });

  if (!link) {
    console.error('❌ Link not found!');
    return;
  }

  console.log('📊 Current settings:');
  console.log(`   Threshold: ${link.similarityThreshold}`);
  console.log(`   Limit: ${link.retrievalLimit}`);
  console.log(`   Priority: ${link.priority}`);

  const updated = await prisma.workflowKnowledgeBase.update({
    where: { id: link.id },
    data: {
      similarityThreshold: 0.4,
    },
  });

  console.log('\n✅ Updated!');
  console.log(`   New Threshold: ${updated.similarityThreshold}`);
  console.log('\n💡 Now test with: "What is on the menu?"\n');

  await prisma.$disconnect();
}

updateThreshold();

