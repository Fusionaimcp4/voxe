import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateKBRequest } from '@/lib/knowledge-base/types';
import { canPerformAction, trackUsage } from '@/lib/usage-tracking';

// GET - List all knowledge bases for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Fetch user's knowledge bases
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            documents: true,
            workflows: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const stats = {
      total: knowledgeBases.length,
      active: knowledgeBases.filter(kb => kb.isActive).length,
      totalDocuments: knowledgeBases.reduce((sum, kb) => sum + kb.totalDocuments, 0),
      totalTokens: knowledgeBases.reduce((sum, kb) => sum + kb.totalTokens, 0),
    };

    return NextResponse.json({
      knowledgeBases: knowledgeBases.map(kb => ({
        ...kb,
        documentCount: kb._count.documents,
        workflowCount: kb._count.workflows,
      })),
      stats,
    });

  } catch (error) {
    console.error('Knowledge bases API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge bases' },
      { status: 500 }
    );
  }
}

// POST - Create a new knowledge base
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: CreateKBRequest = await request.json();

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Check tier limits before proceeding
    const usageCheck = await canPerformAction(userId, 'create_knowledge_base');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Tier limit exceeded',
          message: usageCheck.reason,
          usage: usageCheck.usage,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Validate input
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (body.name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Create knowledge base
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        userId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        type: body.type || 'USER',
        isActive: true,
      },
    });

    // Track usage
    await trackUsage(userId, 'knowledge_base_created');

    return NextResponse.json({
      success: true,
      knowledgeBase,
    }, { status: 201 });

  } catch (error) {
    console.error('Create knowledge base error:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge base' },
      { status: 500 }
    );
  }
}

