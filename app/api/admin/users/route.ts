import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, SubscriptionTier, SubscriptionStatus } from '@/lib/generated/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

// GET /api/admin/users - List users with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const tier = searchParams.get('tier') || '';
    const status = searchParams.get('status') || '';
    const verified = searchParams.get('verified') || '';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (tier) {
      where.subscriptionTier = tier;
    }
    
    if (status) {
      where.subscriptionStatus = status;
    }
    
    if (verified !== '') {
      where.isVerified = verified === 'true';
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          createdAt: true,
          updatedAt: true,
          avatarUrl: true,
          demos: {
            select: {
              id: true,
              businessName: true
            }
          },
          workflows: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(`Admin ${session.user.email} fetched users list`, {
      page,
      limit,
      total,
      filters: { search, role, tier, status, verified }
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    logger.error('Failed to fetch users', { error });
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, company, role, subscriptionTier, subscriptionStatus, password, isVerified } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        company: company || null,
        password: hashedPassword,
        role: role || 'USER',
        subscriptionTier: subscriptionTier || 'FREE',
        subscriptionStatus: subscriptionStatus || 'ACTIVE',
        isVerified: isVerified || false,
        emailVerifiedAt: isVerified ? new Date() : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isVerified: true,
        createdAt: true
      }
    });

    logger.info(`Admin ${session.user.email} created new user`, {
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      tier: user.subscriptionTier
    });

    return NextResponse.json({ user }, { status: 201 });

  } catch (error) {
    logger.error('Failed to create user', { error });
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
