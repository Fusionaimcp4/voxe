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

    return NextResponse.json({
      messages
    });

  } catch (error) {
    console.error('System messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system messages' },
      { status: 500 }
    );
  }
}
