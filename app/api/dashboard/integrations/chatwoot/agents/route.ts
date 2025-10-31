import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all helpdesk users for this user
    const helpdeskUsers = await prisma.helpdeskUser.findMany({
      where: { userId: session.user.id },
      include: {
        inboxes: {
          where: { isActive: true },
          select: { inboxId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const agents = helpdeskUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      chatwootUserId: user.chatwootUserId,
      inboxIds: user.inboxes.map((inbox) => inbox.inboxId),
    }));

    return NextResponse.json({ agents });

  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

