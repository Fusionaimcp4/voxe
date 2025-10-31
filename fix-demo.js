// Run this in your terminal to add the missing demo
// First, exit the Node.js REPL by pressing Ctrl+C, then run:

const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function addMissingDemo() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mcp4.ai' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email);

    // Create the missing demo
    const demo = await prisma.demo.create({
      data: {
        userId: user.id,
        slug: 'plex-tv-5a608c21',
        businessName: 'Plex TV',
        businessUrl: 'https://plex.tv',
        demoUrl: 'http://localhost:3000/demo/plex-tv-5a608c21',
        systemMessageFile: '/system-message/n8n_System_Message_plex-tv-5a608c21',
        chatwootInboxId: 0,
        chatwootWebsiteToken: 'placeholder-token',
        configuration: {
          primaryColor: '#7ee787',
          secondaryColor: '#f4a261',
          logoUrl: null,
          canonicalUrls: []
        }
      }
    });

    console.log('Demo created:', demo.id);

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        demoId: demo.id,
        status: 'ACTIVE',
        configuration: {
          aiModel: 'gpt-4o-mini',
          confidenceThreshold: 0.8,
          escalationRules: [],
          externalIntegrations: []
        }
      }
    });

    console.log('Workflow created:', workflow.id);

    // Create system message
    const systemMessage = await prisma.systemMessage.create({
      data: {
        demoId: demo.id,
        content: '# Plex TV AI Support Agent\n\nThis is a placeholder system message.',
        version: 1,
        isActive: true
      }
    });

    console.log('System message created:', systemMessage.id);
    console.log('✅ All done! Demo should now appear in dashboard.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingDemo();
