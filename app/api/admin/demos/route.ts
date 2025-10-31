import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Fetch all demos with user information
    const demos = await prisma.demo.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            subscriptionTier: true
          }
        },
        workflows: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      demos
    });

  } catch (error) {
    console.error('Failed to fetch demos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demos' },
      { status: 500 }
    );
  }
}

