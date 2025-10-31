import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listInboxes } from '@/lib/chatwoot_helpdesk';
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

    // Get all Chatwoot inboxes for this user's account
    const chatwootInboxes = await listInboxes(session.user.id);
    
    // Get only the inboxes that belong to this user's demos
    // This ensures tenant isolation - users only see inboxes from their own demos
    const userDemos = await prisma.demo.findMany({
      where: {
        userId: session.user.id,
        chatwootInboxId: { not: null },
      },
      select: {
        chatwootInboxId: true,
      },
    });

    const allowedInboxIds = new Set(userDemos.map(d => d.chatwootInboxId).filter(id => id !== null));

    // Filter inboxes to only those belonging to this user's demos
    const inboxes = chatwootInboxes
      .filter(inbox => allowedInboxIds.has(inbox.id))
      .map((inbox) => ({
        id: inbox.id,
        name: inbox.name,
      }));

    return NextResponse.json({ inboxes });

  } catch (error) {
    console.error('Failed to fetch inboxes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inboxes' },
      { status: 500 }
    );
  }
}

