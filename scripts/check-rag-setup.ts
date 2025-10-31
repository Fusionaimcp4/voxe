/**
 * Check RAG Setup - Diagnostic Script
 * Run: npx ts-node scripts/check-rag-setup.ts
 */

import { prisma } from '../lib/prisma';

async function checkRAGSetup() {
  console.log('🔍 Checking RAG Setup...\n');

  // Check Knowledge Bases
  console.log('📚 Knowledge Bases:');
  const kbs = await prisma.knowledgeBase.findMany({
    include: {
      documents: {
        include: {
          _count: {
            select: { chunks: true }
          }
        }
      }
    }
  });

  for (const kb of kbs) {
    console.log(`\n  ✓ ${kb.name} (${kb.id})`);
    console.log(`    - Active: ${kb.isActive}`);
    console.log(`    - Documents: ${kb.totalDocuments}`);
    console.log(`    - Chunks: ${kb.totalChunks}`);
    console.log(`    - Tokens: ${kb.totalTokens}`);
    
    for (const doc of kb.documents) {
      console.log(`      • ${doc.originalName}: ${doc.status} (${doc._count.chunks} chunks)`);
    }
  }

  // Check Workflows
  console.log('\n\n🔄 Workflows:');
  const workflows = await prisma.workflow.findMany({
    include: {
      demo: true,
      knowledgeBases: {
        include: {
          knowledgeBase: true
        }
      }
    }
  });

  for (const workflow of workflows) {
    console.log(`\n  ✓ ${workflow.demo?.businessName || 'Unknown'} (${workflow.id})`);
    console.log(`    - Demo ID: ${workflow.demoId}`);
    console.log(`    - Assigned KBs: ${workflow.knowledgeBases.length}`);
    
    for (const wkb of workflow.knowledgeBases) {
      console.log(`      • ${wkb.knowledgeBase.name} (priority: ${wkb.priority}, active: ${wkb.isActive})`);
    }
  }

  // Summary
  console.log('\n\n📊 Summary:');
  console.log(`  • Total Knowledge Bases: ${kbs.length}`);
  console.log(`  • Total Workflows: ${workflows.length}`);
  console.log(`  • KBs with documents: ${kbs.filter(kb => kb.totalDocuments > 0).length}`);
  console.log(`  • Workflows with KBs: ${workflows.filter(w => w.knowledgeBases.length > 0).length}`);

  await prisma.$disconnect();
}

checkRAGSetup().catch(console.error);

