import { prisma } from '../lib/prisma';

async function checkWorkflow() {
  console.log('🔍 Checking for melangefoods.com workflow...\n');

  // Search by workflow ID from n8n
  const workflowById = await prisma.workflow.findUnique({
    where: { id: 'zCpmybq6jjvLYenU' },
    include: {
      demo: true,
      knowledgeBases: {
        include: {
          knowledgeBase: true,
        },
      },
    },
  });

  if (workflowById) {
    console.log('✅ Found by ID:', workflowById.id);
    console.log('   Demo:', workflowById.demo?.businessName || 'No demo');
    console.log('   Knowledge Bases:', workflowById.knowledgeBases.length);
  } else {
    console.log('❌ Workflow ID "zCpmybq6jjvLYenU" NOT FOUND in database\n');
  }

  // Search for melangefoods demos
  const melangefoods = await prisma.demo.findMany({
    where: {
      OR: [
        { businessName: { contains: 'melange', mode: 'insensitive' } },
        { businessUrl: { contains: 'melange', mode: 'insensitive' } },
        { slug: { contains: 'melange', mode: 'insensitive' } },
      ],
    },
    include: {
      workflows: true,
    },
  });

  if (melangefoods.length > 0) {
    console.log('\n📋 Found melange-related demos:\n');
    for (const demo of melangefoods) {
      console.log(`  • ${demo.businessName} (${demo.slug})`);
      console.log(`    URL: ${demo.businessUrl}`);
      console.log(`    Demo ID: ${demo.id}`);
      if (demo.workflows.length > 0) {
        for (const wf of demo.workflows) {
          console.log(`    Workflow ID: ${wf.id}`);
          console.log(`    Workflow n8nId: ${wf.n8nWorkflowId || 'N/A'}`);
        }
      } else {
        console.log(`    NO WORKFLOW`);
      }
      console.log('');
    }
  } else {
    console.log('\n❌ No melange-related demos found\n');
  }

  // List all workflows
  const allWorkflows = await prisma.workflow.findMany({
    include: {
      demo: true,
    },
  });

  console.log(`\n📊 Total workflows in database: ${allWorkflows.length}\n`);
  if (allWorkflows.length > 0) {
    console.log('All workflows:');
    for (const wf of allWorkflows) {
      console.log(`  • ${wf.demo.businessName}`);
      console.log(`    Workflow ID: ${wf.id}`);
      console.log(`    n8n Workflow ID: ${wf.n8nWorkflowId || 'N/A'}`);
      console.log('');
    }
  }

  await prisma.$disconnect();
}

checkWorkflow().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

