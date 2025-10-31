import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Fetch dashboard statistics
    const [
      totalDemos,
      totalUsers,
      totalWorkflows,
      totalContacts,
      activeWorkflows,
      recentDemos
    ] = await Promise.all([
      prisma.demo.count(),
      prisma.user.count(),
      prisma.workflow.count(),
      prisma.contact.count(),
      prisma.workflow.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.demo.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    const stats = {
      totalDemos,
      totalUsers,
      totalWorkflows,
      totalContacts,
      activeWorkflows
    };

    return NextResponse.json({
      stats,
      recentDemos
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}