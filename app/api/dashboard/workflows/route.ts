/**
 * Workflows API - List user's workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET - List all workflows for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        demo: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            demoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const stats = {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'ACTIVE').length,
      inactiveWorkflows: workflows.filter(w => w.status === 'INACTIVE').length,
      errorWorkflows: workflows.filter(w => w.status === 'ERROR').length,
    };

    return NextResponse.json({
      success: true,
      workflows,
      stats,
    });
  } catch (error) {
    console.error('[Workflows] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}
