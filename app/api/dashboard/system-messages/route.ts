import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // First get user's demos
    const demos = await prisma.demo.findMany({
      where: { userId },
      select: { id: true }
    });

    console.log(`[System Messages API] Found ${demos.length} demos for user ${userId}`);

    // If no demos, return empty array
    if (demos.length === 0) {
      return NextResponse.json({
        messages: []
      });
    }

    // Fetch user's system messages
    const messages = await prisma.systemMessage.findMany({
      where: {
        demoId: {
          in: demos.map(d => d.id)
        }
      },
      include: {
        demo: {
          select: {
            businessName: true,
            slug: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`[System Messages API] Found ${messages.length} system messages for user ${userId}`);

    // Check if there are demos without system messages
    const demoIds = demos.map(d => d.id);
    const messageDemoIds = messages.map(m => m.demoId);
    const demosWithoutMessages = demoIds.filter(id => !messageDemoIds.includes(id));
    
    if (demosWithoutMessages.length > 0) {
      console.warn(`[System Messages API] Found ${demosWithoutMessages.length} demos without system messages:`, demosWithoutMessages);
    }

    return NextResponse.json({
      messages
    });

  } catch (error) {
    console.error('System messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
