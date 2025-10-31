import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addAgentToInbox, removeAgentFromInbox } from '@/lib/chatwoot_helpdesk';

export async function POST(request: NextRequest) {
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

    const { agentId, inboxId, action } = await request.json();

    if (!agentId || !inboxId || !action) {
      return NextResponse.json(
        { error: 'Agent ID, inbox ID, and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Action must be "add" or "remove"' },
        { status: 400 }
      );
    }

    // Get agent
    const agent = await prisma.helpdeskUser.findUnique({
      where: { id: agentId },
      select: { userId: true, chatwootUserId: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (agent.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Perform action in Chatwoot
    console.log(`🔧 About to ${action} agent to inbox`);
    console.log(`📝 Agent Chatwoot ID: ${agent.chatwootUserId}`);
    console.log(`📝 Inbox ID: ${inboxId}`);
    
    const chatwootSuccess = action === 'add'
      ? await addAgentToInbox(session.user.id, agent.chatwootUserId!, inboxId)
      : await removeAgentFromInbox(session.user.id, agent.chatwootUserId!, inboxId);

    if (!chatwootSuccess) {
      return NextResponse.json(
        { error: `Failed to ${action} agent from inbox in Chatwoot` },
        { status: 500 }
      );
    }

    // Update database
    if (action === 'add') {
      await prisma.helpdeskUserInbox.upsert({
        where: {
          helpdeskUserId_inboxId: {
            helpdeskUserId: agentId,
            inboxId,
          },
        },
        create: {
          helpdeskUserId: agentId,
          inboxId,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });
    } else {
      await prisma.helpdeskUserInbox.updateMany({
        where: {
          helpdeskUserId: agentId,
          inboxId,
        },
        data: {
          isActive: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Agent ${action === 'add' ? 'added to' : 'removed from'} inbox`,
    });

  } catch (error) {
    console.error('Failed to assign agent:', error);
    return NextResponse.json(
      { error: 'Failed to assign agent' },
      { status: 500 }
    );
  }
}

