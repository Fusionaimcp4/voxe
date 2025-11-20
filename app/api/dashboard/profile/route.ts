import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        emailVerifiedAt: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        lastLoginAt: true,
        totpSecret: true, // To check if 2FA is enabled
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        ...user,
        has2FA: !!user.totpSecret,
        totpSecret: undefined, // Don't send secret to frontend
      },
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { name, company, avatarUrl } = body;

    // Validate input
    const updates: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (company !== undefined) {
      if (company !== null && (typeof company !== 'string' || company.trim().length === 0)) {
        return NextResponse.json(
          { error: 'Company must be a non-empty string or null' },
          { status: 400 }
        );
      }
      updates.company = company === null || company === '' ? null : company.trim();
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && (typeof avatarUrl !== 'string' || !avatarUrl.trim())) {
        return NextResponse.json(
          { error: 'Avatar URL must be a valid URL or null' },
          { status: 400 }
        );
      }
      // Basic URL validation
      if (avatarUrl && avatarUrl.trim()) {
        try {
          new URL(avatarUrl.trim());
        } catch {
          return NextResponse.json(
            { error: 'Avatar URL must be a valid URL' },
            { status: 400 }
          );
        }
      }
      updates.avatarUrl = avatarUrl === null || avatarUrl === '' ? null : avatarUrl.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

