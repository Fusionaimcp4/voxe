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

    // Optimized: Fetch only recent demos with aggregated counts
    // This reduces from 4 queries to 2 queries
    const [recentDemos, aggregates] = await Promise.all([
      prisma.demo.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          businessName: true,
          businessUrl: true,
          demoUrl: true,
          systemMessageFile: true,
          createdAt: true,
          workflows: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }),
      // Aggregate queries in a single transaction for better performance
      prisma.$transaction([
        prisma.demo.count({ where: { userId } }),
        prisma.workflow.count({ where: { userId, status: 'ACTIVE' } }),
        prisma.contact.count({ where: { demo: { userId } } })
      ])
    ]);

    const [totalDemos, activeWorkflows, totalContacts] = aggregates;

    const stats = {
      totalDemos,
      activeWorkflows,
      totalContacts
    };

    // Add cache headers for better performance (cache for 30 seconds)
    return NextResponse.json(
      { stats, recentDemos },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );

  } catch (error) {
    console.error('User dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
