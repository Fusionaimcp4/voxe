import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { slug, businessName, businessUrl, demoUrl } = await request.json();

    // Check if demo already exists
    const existingDemo = await prisma.demo.findFirst({
      where: {
        OR: [
          { slug },
          { demoUrl }
        ]
      }
    });

    if (existingDemo) {
      return NextResponse.json({
        message: 'Demo already exists',
        demo: existingDemo
      });
    }

    // Create the demo
    const demo = await prisma.demo.create({
      data: {
        userId,
        slug,
        businessName,
        businessUrl,
        demoUrl,
        systemMessageFile: `/system-message/n8n_System_Message_${slug}`,
        chatwootInboxId: 0, // Placeholder
        chatwootWebsiteToken: 'placeholder-token',
        configuration: {
          primaryColor: '#7ee787',
          secondaryColor: '#f4a261',
          logoUrl: null,
          canonicalUrls: []
        }
      }
    });

    // Create associated workflow
    const workflow = await prisma.workflow.create({
      data: {
        userId,
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

    // Create system message
    const systemMessage = await prisma.systemMessage.create({
      data: {
        demoId: demo.id,
        content: `# ${businessName} AI Support Agent\n\nThis is a placeholder system message for the ${businessName} demo.`,
        version: 1,
        isActive: true
      }
    });

    return NextResponse.json({
      message: 'Demo added successfully',
      demo,
      workflow,
      systemMessage
    });

  } catch (error) {
    console.error('Add demo API error:', error);
    return NextResponse.json(
      { error: 'Failed to add demo' },
      { status: 500 }
    );
  }
}
