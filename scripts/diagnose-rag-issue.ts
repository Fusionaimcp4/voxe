/**
 * Comprehensive RAG Diagnostic Tool
 * Tests every step of the RAG pipeline
 */

import { prisma } from '../lib/prisma';

async function diagnose() {
  console.log('🔍 RAG Integration Diagnostic Tool\n');
  console.log('='.repeat(60));

  // Step 1: Check KB
  console.log('\n📚 Step 1: Checking Knowledge Base...');
  const kb = await prisma.knowledgeBase.findFirst({
    where: { name: { contains: 'Melange', mode: 'insensitive' } },
    include: {
      documents: {
        include: {
          _count: { select: { chunks: true } },
        },
      },
    },
  });

  if (!kb) {
    console.error('❌ CRITICAL: No Knowledge Base found!');
    return;
  }

  console.log(`✅ KB Found: ${kb.name}`);
  console.log(`   Documents: ${kb.documents.length}`);
  console.log(`   Chunks: ${kb.totalChunks}`);
  console.log(`   Active: ${kb.isActive}`);

  if (kb.documents.length === 0) {
    console.error('❌ CRITICAL: No documents uploaded!');
    return;
  }

  // Check document status
  for (const doc of kb.documents) {
    console.log(`\n   📄 ${doc.originalName}:`);
    console.log(`      Status: ${doc.status}`);
    console.log(`      Chunks: ${doc._count.chunks}`);
    if (doc.status !== 'COMPLETED') {
      console.warn(`      ⚠️  Document not completed!`);
    }
  }

  // Step 2: Check Workflow
  console.log('\n\n⚡ Step 2: Checking Workflow...');
  const workflow = await prisma.workflow.findFirst({
    where: { n8nWorkflowId: 'zCpmybq6jjvLYenU' },
    include: { demo: true },
  });

  if (!workflow) {
    console.error('❌ CRITICAL: Workflow not found!');
    return;
  }

  console.log(`✅ Workflow: ${workflow.demo.businessName}`);
  console.log(`   n8n ID: ${workflow.n8nWorkflowId}`);
  console.log(`   Status: ${workflow.status}`);

  // Step 3: Check Link
  console.log('\n\n🔗 Step 3: Checking KB-Workflow Link...');
  const link = await prisma.workflowKnowledgeBase.findFirst({
    where: {
      workflowId: workflow.id,
      knowledgeBaseId: kb.id,
    },
  });

  if (!link) {
    console.error('❌ CRITICAL: No link between KB and Workflow!');
    console.log('\n💡 Fix: Go to dashboard and link them');
    return;
  }

  console.log(`✅ Link Active: ${link.isActive}`);
  console.log(`   Priority: ${link.priority}`);
  console.log(`   Limit: ${link.retrievalLimit} chunks`);
  console.log(`   Threshold: ${link.similarityThreshold}`);

  if (!link.isActive) {
    console.warn('⚠️  WARNING: Link is inactive!');
  }

  if (link.similarityThreshold > 0.5) {
    console.warn(`⚠️  WARNING: Threshold ${link.similarityThreshold} might be too high!`);
    console.warn('   Recommended: 0.4-0.5');
  }

  // Step 4: Check Document Chunks & Embeddings
  console.log('\n\n🧩 Step 4: Checking Document Chunks...');
  const chunks = await prisma.documentChunk.findMany({
    where: {
      document: {
        knowledgeBaseId: kb.id,
        status: 'COMPLETED',
      },
    },
    take: 3,
  });

  if (chunks.length === 0) {
    console.error('❌ CRITICAL: No chunks found!');
    return;
  }

  console.log(`✅ Found ${chunks.length} chunks (showing first 3)`);
  for (const chunk of chunks) {
    console.log(`\n   Chunk ${chunk.chunkIndex}:`);
    console.log(`      Tokens: ${chunk.tokenCount}`);
    console.log(`      Has embedding: ${chunk.embedding ? 'Yes' : 'No'}`);
    console.log(`      Preview: ${chunk.content.substring(0, 100)}...`);
    
    if (!chunk.embedding) {
      console.error('      ❌ CRITICAL: No embedding!');
    }
  }

  // Step 5: Test RAG API
  console.log('\n\n🎯 Step 5: Testing RAG API...');
  console.log('\nTest with this command:');
  console.log('─'.repeat(60));
  console.log(`
curl -X POST http://localhost:3000/api/rag/retrieve \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What is on the menu?",
    "workflowId": "${workflow.n8nWorkflowId}",
    "limit": ${link.retrievalLimit},
    "similarityThreshold": ${link.similarityThreshold}
  }'
  `);
  console.log('─'.repeat(60));

  // Step 6: n8n Checklist
  console.log('\n\n🔧 Step 6: n8n Workflow Checklist:');
  console.log('─'.repeat(60));
  console.log('[ ] 1. n8n workflow URL: https://n8n.sost.work/workflow/zCpmybq6jjvLYenU');
  console.log(`[ ] 2. "Retrieve Knowledge Base Context" node exists`);
  console.log(`[ ] 3. Node is connected to "AI Agent" as a tool`);
  console.log(`[ ] 4. HTTP Request settings:`);
  console.log(`    - Method: POST`);
  console.log(`    - URL: http://localhost:3000/api/rag/retrieve`);
  console.log(`         OR: https://ac691440db0c.ngrok-free.app/api/rag/retrieve`);
  console.log(`    - Body: JSON with workflowId, query, threshold`);
  console.log(`    - Threshold: ${link.similarityThreshold} (not 0.7!)`);
  console.log(`[ ] 5. AI Agent system message includes instruction to use RAG tool`);
  console.log(`[ ] 6. Workflow is ACTIVE (not paused)`);
  console.log('─'.repeat(60));

  // Summary
  console.log('\n\n📊 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(60));
  const issues: string[] = [];
  
  if (kb.documents.length === 0) issues.push('No documents uploaded');
  if (kb.totalChunks === 0) issues.push('No chunks created');
  if (!kb.isActive) issues.push('KB is inactive');
  if (!link) issues.push('KB not linked to workflow');
  if (link && !link.isActive) issues.push('Link is inactive');
  if (link && link.similarityThreshold > 0.5) issues.push(`Threshold too high (${link.similarityThreshold})`);
  if (chunks.some(c => !c.embedding)) issues.push('Some chunks missing embeddings');

  if (issues.length === 0) {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Update n8n workflow threshold to 0.4');
    console.log('2. Make sure ngrok is running and URL is correct');
    console.log('3. Test in Chatwoot: "What is on the menu?"');
    console.log('4. Check n8n execution logs to see if RAG tool was called');
  } else {
    console.log('❌ ISSUES FOUND:');
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
  }
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

diagnose().catch(console.error);

