import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, SubscriptionTier, SubscriptionStatus } from '@/lib/generated/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

// GET /api/admin/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        demos: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            createdAt: true
          }
        },
        workflows: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        knowledgeBases: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        },
        apiCallLogs: {
          select: {
            id: true,
            endpoint: true,
            method: true,
            statusCode: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    logger.info(`Admin ${session.user.email} fetched user details`, {
      userId: user.id,
      userEmail: user.email
    });

    return NextResponse.json({ user });

  } catch (error) {
    logger.error('Failed to fetch user', { error });
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { name, email, company, role, subscriptionTier, subscriptionStatus, password, isVerified } = body as {
      name?: string;
      email?: string;
      company?: string;
      role?: UserRole;
      subscriptionTier?: string;
      subscriptionStatus?: SubscriptionStatus;
      password?: string;
      isVerified?: boolean;
    };

    // Normalize legacy tier names to new ones to ensure persistence
    if (subscriptionTier) {
      const mapLegacy: Record<string, SubscriptionTier> = {
        PRO: 'TEAM',
        PRO_PLUS: 'BUSINESS',
      } as const;
      const upper = String(subscriptionTier).toUpperCase();
      if (upper in mapLegacy) {
        subscriptionTier = mapLegacy[upper];
      }
      // Whitelist allowed values; fallback to FREE if an invalid value slips through
      const allowed: SubscriptionTier[] = ['FREE', 'STARTER', 'TEAM', 'BUSINESS', 'ENTERPRISE'];
      if (!allowed.includes(subscriptionTier as SubscriptionTier)) {
        subscriptionTier = 'FREE';
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already taken' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (role !== undefined) updateData.role = role;
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier as SubscriptionTier;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
      if (isVerified && !existingUser.emailVerifiedAt) {
        updateData.emailVerifiedAt = new Date();
      }
    }
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isVerified: true,
        emailVerifiedAt: true,
        updatedAt: true
      }
    });

    logger.info(`Admin ${session.user.email} updated user`, {
      userId: user.id,
      userEmail: user.email,
      changes: Object.keys(updateData)
    });

    return NextResponse.json({ user });

  } catch (error) {
    logger.error('Failed to update user', { error });
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of other super admins (only super admins can delete super admins)
    if (existingUser.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot delete super admin account' }, { status: 403 });
    }

    // Delete verification tokens first to avoid foreign key constraint
    await prisma.verificationToken.deleteMany({
      where: { userId: id }
    });

    // Delete user (this will cascade delete related records due to Prisma relations)
    await prisma.user.delete({
      where: { id }
    });

    logger.info(`Admin ${session.user.email} deleted user`, {
      deletedUserId: existingUser.id,
      deletedUserEmail: existingUser.email,
      deletedUserRole: existingUser.role
    });

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    logger.error('Failed to delete user', { error });
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
