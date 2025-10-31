import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateKBRequest } from '@/lib/knowledge-base/types';
import { promises as fs } from 'fs';
import path from 'path';

// GET - Get single knowledge base with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { chunks: true },
            },
          },
        },
        workflows: {
          include: {
            workflow: {
              select: {
                id: true,
                status: true,
                demo: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: 'Knowledge base not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ knowledgeBase });

  } catch (error) {
    console.error('Get knowledge base error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    );
  }
}

// PUT - Update knowledge base
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;
    const body: UpdateKBRequest = await request.json();

    // Verify ownership
    const existing = await prisma.knowledgeBase.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Knowledge base not found' },
        { status: 404 }
      );
    }

    // Validate input
    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      if (body.name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be 100 characters or less' },
          { status: 400 }
        );
      }
    }

    // Update knowledge base
    const knowledgeBase = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      knowledgeBase,
    });

  } catch (error) {
    console.error('Update knowledge base error:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge base' },
      { status: 500 }
    );
  }
}

// DELETE - Delete knowledge base and all associated files
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify ownership and get KB details
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { id, userId },
      include: { documents: true },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: 'Knowledge base not found' },
        { status: 404 }
      );
    }

    // Delete files from disk
    const storagePath = path.join(
      process.cwd(),
      'public',
      'knowledge-bases',
      userId,
      id
    );

    try {
      await fs.rm(storagePath, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to delete KB files:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database (cascades to documents and chunks)
    await prisma.knowledgeBase.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Knowledge base deleted successfully',
    });

  } catch (error) {
    console.error('Delete knowledge base error:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge base' },
      { status: 500 }
    );
  }
}

